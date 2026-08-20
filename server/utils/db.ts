import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

let db: DatabaseSync | null = null

export function useDb() {
  if (db) return db

  const config = useRuntimeConfig()
  const path = resolve(config.databasePath)
  mkdirSync(dirname(path), { recursive: true })

  db = new DatabaseSync(path)
  // WAL lets the CSV export script (a reader) and a survey submission (a writer) run
  // concurrently without blocking each other; busy_timeout makes SQLite retry briefly
  // instead of throwing SQLITE_BUSY immediately on the rare remaining contention.
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA busy_timeout = 5000')
  db.exec(`
    CREATE TABLE IF NOT EXISTS survey_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interest TEXT,
      sizes TEXT,
      comment TEXT,
      created_at TEXT NOT NULL,
      user_agent TEXT
    )
  `)
  return db
}

export interface SurveyResponseInput {
  interest: string | null
  sizes: string[]
  comment: string
  userAgent: string | null
}

export function insertSurveyResponse(input: SurveyResponseInput) {
  const database = useDb()
  const stmt = database.prepare(
    `INSERT INTO survey_responses (interest, sizes, comment, created_at, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
  )
  stmt.run(
    input.interest,
    JSON.stringify(input.sizes),
    input.comment,
    new Date().toISOString(),
    input.userAgent,
  )
}
