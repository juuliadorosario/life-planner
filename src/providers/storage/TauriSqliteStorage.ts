import { appConfigDir } from '@tauri-apps/api/path'
import Database from '@tauri-apps/plugin-sql'
import type { QueryMethod, StorageProvider } from './StorageProvider'

const DB_URL = 'sqlite:lifeos.db'

/**
 * Native SQLite through tauri-plugin-sql. The database file lives in the app's
 * data directory, ~/Library/Application Support/<bundle identifier>/lifeos.db.
 */
export class TauriSqliteStorage implements StorageProvider {
  readonly kind = 'tauri-sqlite' as const
  readonly location: string
  private db: Database

  private constructor(db: Database, location: string) {
    this.db = db
    this.location = location
  }

  static async open(): Promise<TauriSqliteStorage> {
    const db = await Database.load(DB_URL)
    await db.execute('PRAGMA foreign_keys = ON')
    const dir = await appConfigDir()
    return new TauriSqliteStorage(db, `${dir.replace(/^\/Users\/[^/]+/, '~')}/lifeos.db`)
  }

  async query(sql: string, params: unknown[], method: QueryMethod) {
    if (method === 'run') {
      await this.db.execute(sql, params)
      return { rows: [] }
    }
    // The plugin returns objects keyed by column name, in column order.
    const objects = await this.db.select<Record<string, unknown>[]>(sql, params)
    const rows = objects.map((o) => Object.values(o))
    return { rows: method === 'get' ? (rows[0] as unknown[]) : rows }
  }

  async exec(script: string) {
    for (const statement of script.split(/;\s*$/m)) {
      if (statement.trim()) await this.db.execute(statement)
    }
  }

  async reset() {
    const tables = await this.db.select<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
    await this.db.execute('PRAGMA foreign_keys = OFF')
    for (const { name } of tables) await this.db.execute(`DROP TABLE IF EXISTS "${name}"`)
    await this.db.execute('PRAGMA foreign_keys = ON')
  }
}
