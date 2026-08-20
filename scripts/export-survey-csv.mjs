#!/usr/bin/env node
// Dumps every survey response as CSV to stdout.
// Usage (from the Proxmox host, over SSH): docker exec homerack node scripts/export-survey-csv.mjs > responses.csv
import { DatabaseSync } from 'node:sqlite'
import { resolve } from 'node:path'

// NUXT_DATABASE_PATH is what the app itself reads (Nuxt's runtimeConfig env
// convention) — check that first so this script always points at the same file,
// falling back to a plain DATABASE_PATH for standalone/non-Nuxt-env use.
const path = resolve(process.env.NUXT_DATABASE_PATH || process.env.DATABASE_PATH || './data/homerack.db')
const db = new DatabaseSync(path, { readOnly: true })
db.exec('PRAGMA busy_timeout = 5000') // wait briefly instead of throwing if the server is mid-write

const rows = db.prepare('SELECT id, interest, sizes, comment, created_at, user_agent FROM survey_responses ORDER BY id').all()

function csvField(value) {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

const header = ['id', 'interest', 'sizes', 'comment', 'created_at', 'user_agent']
process.stdout.write(header.join(',') + '\n')

for (const row of rows) {
  const sizes = (() => {
    try {
      return JSON.parse(row.sizes ?? '[]').join('; ')
    } catch {
      return row.sizes ?? ''
    }
  })()
  const line = [row.id, row.interest, sizes, row.comment, row.created_at, row.user_agent].map(csvField)
  process.stdout.write(line.join(',') + '\n')
}

db.close()
