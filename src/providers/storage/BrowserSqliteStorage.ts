import initSqlJs, { type Database } from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import type { QueryMethod, StorageProvider } from './StorageProvider'

const IDB_NAME = 'lifeos'
const IDB_STORE = 'sqlite'
const IDB_KEY = 'main'

function idb<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(IDB_NAME, 1)
    open.onupgradeneeded = () => open.result.createObjectStore(IDB_STORE)
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const tx = open.result.transaction(IDB_STORE, mode)
      const req = fn(tx.objectStore(IDB_STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    }
  })
}

/**
 * SQLite compiled to WebAssembly, persisted to IndexedDB. Used when LifeOS runs
 * in a normal browser (development, previews). Writes are flushed shortly after
 * they happen and when the tab is hidden.
 */
export class BrowserSqliteStorage implements StorageProvider {
  readonly kind = 'browser-sqlite' as const
  readonly location = 'Browser storage (IndexedDB)'
  private saveTimer: number | undefined
  private db: Database

  private constructor(db: Database) {
    this.db = db
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void this.flush()
    })
  }

  static async open(): Promise<BrowserSqliteStorage> {
    const SQL = await initSqlJs({ locateFile: () => wasmUrl })
    const saved = await idb<Uint8Array | undefined>('readonly', (s) => s.get(IDB_KEY)).catch(() => undefined)
    const db = saved ? new SQL.Database(saved) : new SQL.Database()
    db.run('PRAGMA foreign_keys = ON')
    return new BrowserSqliteStorage(db)
  }

  async query(sql: string, params: unknown[], method: QueryMethod) {
    const bind = params as (string | number | null | Uint8Array)[]
    if (method === 'run') {
      this.db.run(sql, bind)
      this.scheduleSave()
      return { rows: [] }
    }
    const stmt = this.db.prepare(sql)
    try {
      stmt.bind(bind)
      const rows: unknown[][] = []
      while (stmt.step()) {
        rows.push(stmt.get())
        if (method === 'get') break
      }
      // Statements like INSERT … RETURNING come through here too.
      if (!/^\s*select/i.test(sql)) this.scheduleSave()
      // Drizzle expects `undefined` (not an empty row) when `get` finds nothing.
      return { rows: method === 'get' ? (rows[0] as unknown[]) : rows }
    } finally {
      stmt.free()
    }
  }

  async exec(script: string) {
    this.db.exec(script)
    await this.flush()
  }

  async exportBytes() {
    return this.db.export()
  }

  async reset() {
    const SQL = await initSqlJs({ locateFile: () => wasmUrl })
    this.db.close()
    this.db = new SQL.Database()
    this.db.run('PRAGMA foreign_keys = ON')
    await this.flush()
  }

  private scheduleSave() {
    window.clearTimeout(this.saveTimer)
    this.saveTimer = window.setTimeout(() => void this.flush(), 400)
  }

  private async flush() {
    window.clearTimeout(this.saveTimer)
    const bytes = this.db.export()
    await idb('readwrite', (s) => s.put(bytes, IDB_KEY))
  }
}
