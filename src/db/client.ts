import { drizzle, type SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy'
import { isTauri, type StorageProvider } from '@/providers/storage/StorageProvider'
import * as schema from './schema'
import { runMigrations } from './migrate'
import { seedIfEmpty } from './seed'

export type DB = SqliteRemoteDatabase<typeof schema>

// Kept on globalThis so a hot-reloaded copy of this module (development) keeps
// using the database that was already opened instead of an uninitialised one.
const state = ((globalThis as { __lifeosDb?: { storage?: StorageProvider; database?: DB } }).__lifeosDb ??= {})

/** Open storage, run migrations and seed demo data on first launch. */
export async function initDatabase(): Promise<void> {
  const storage = isTauri()
    ? await (await import('@/providers/storage/TauriSqliteStorage')).TauriSqliteStorage.open()
    : await (await import('@/providers/storage/BrowserSqliteStorage')).BrowserSqliteStorage.open()
  state.storage = storage
  state.database = drizzle((sql, params, method) => storage.query(sql, params, method), { schema })
  await runMigrations(storage)
  await seedIfEmpty(state.database)
}

export function db(): DB {
  if (!state.database) throw new Error('Database not initialised')
  return state.database
}

export function getStorage(): StorageProvider {
  return state.storage!
}

/** Drop everything and start again from the demo data. */
export async function resetDatabase(): Promise<void> {
  await getStorage().reset()
  await runMigrations(getStorage())
  await seedIfEmpty(db())
}
