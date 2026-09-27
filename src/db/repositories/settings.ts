import { eq } from 'drizzle-orm'
import { db } from '../client'
import { settings } from '../schema'

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const rows = await db().select().from(settings)
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db()
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const row = await db().select().from(settings).where(eq(settings.key, key)).get()
  return row?.value as T | undefined
}

export async function deleteSetting(key: string): Promise<void> {
  await db().delete(settings).where(eq(settings.key, key))
}
