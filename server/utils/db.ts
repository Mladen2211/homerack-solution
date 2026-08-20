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

export interface SurveyResponseRow {
  id: number
  interest: string | null
  sizes: string[]
  comment: string
  createdAt: string
}

// Deliberately omits user_agent — this backs the results dashboard, which is
// unauthenticated (unguessable-path only), so per-visitor identifying data stays
// SSH-export-only rather than reachable through the JSON API.
export function getSurveyResponses(): SurveyResponseRow[] {
  const database = useDb()
  const rows = database
    .prepare('SELECT id, interest, sizes, comment, created_at FROM survey_responses ORDER BY id ASC')
    .all() as { id: number; interest: string | null; sizes: string; comment: string; created_at: string }[]

  return rows.map((row) => {
    let sizes: string[] = []
    try {
      sizes = JSON.parse(row.sizes ?? '[]')
    } catch {
      sizes = []
    }
    return {
      id: row.id,
      interest: row.interest,
      sizes,
      comment: row.comment ?? '',
      createdAt: row.created_at,
    }
  })
}
