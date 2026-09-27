/**
 * The lowest layer of LifeOS: something that can run SQL against a SQLite
 * database. Drizzle sits on top of this, so the UI never knows whether it runs
 * inside the Tauri app (native SQLite file) or a browser tab (sql.js).
 */
export type QueryMethod = 'run' | 'all' | 'values' | 'get'

export interface StorageProvider {
  readonly kind: 'tauri-sqlite' | 'browser-sqlite'
  /** Human-readable location of the data, shown in Settings. */
  readonly location: string
  /** Rows are returned as arrays of column values, in column order. */
  query(sql: string, params: unknown[], method: QueryMethod): Promise<{ rows: unknown[] }>
  /** Run a multi-statement script (migrations). */
  exec(script: string): Promise<void>
  /** Raw database bytes, for backups. */
  exportBytes?(): Promise<Uint8Array>
  /** Wipe all data (used by "Reset demo data"). */
  reset(): Promise<void>
}

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}
