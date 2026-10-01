import { desc, eq } from 'drizzle-orm'
import { db } from '../client'
import { creativeItems } from '../schema'
import { newId } from '@/types/domain'

export type CreativeItem = typeof creativeItems.$inferSelect

export async function listCreativeItems(): Promise<CreativeItem[]> {
  return db().select().from(creativeItems).orderBy(desc(creativeItems.createdAt))
}

export async function addCreativeItem(input: Omit<typeof creativeItems.$inferInsert, 'id'>): Promise<CreativeItem> {
  const [row] = await db()
    .insert(creativeItems)
    .values({ id: newId(), ...input })
    .returning()
  return row
}

export async function updateCreativeItem(id: string, patch: Partial<Pick<CreativeItem, 'text' | 'kind' | 'board'>>): Promise<void> {
  await db().update(creativeItems).set(patch).where(eq(creativeItems.id, id))
}

export async function deleteCreativeItem(id: string): Promise<void> {
  await db().delete(creativeItems).where(eq(creativeItems.id, id))
}

/** Rename a board by moving all of its items. */
export async function renameBoard(from: string, to: string): Promise<void> {
  await db().update(creativeItems).set({ board: to }).where(eq(creativeItems.board, from))
}
