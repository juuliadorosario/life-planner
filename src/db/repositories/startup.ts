import { asc, eq } from 'drizzle-orm'
import { db } from '../client'
import { links, startupMetrics } from '../schema'
import { newId, type Link } from '@/types/domain'

export async function listMetrics() {
  return db().select().from(startupMetrics).orderBy(asc(startupMetrics.month))
}

export async function upsertMetric(month: string, values: { revenue: number; mrr: number; expenses: number; users: number }): Promise<void> {
  await db()
    .insert(startupMetrics)
    .values({ id: newId(), month, ...values })
    .onConflictDoUpdate({ target: startupMetrics.month, set: values })
}

export async function listLinks(filter: { collection?: string; projectId?: string; subjectId?: string } = {}): Promise<Link[]> {
  const where = filter.projectId
    ? eq(links.projectId, filter.projectId)
    : filter.subjectId
      ? eq(links.subjectId, filter.subjectId)
      : filter.collection
        ? eq(links.collection, filter.collection)
        : undefined
  return db().select().from(links).where(where).orderBy(asc(links.sortOrder), asc(links.createdAt))
}

export async function createLink(input: Omit<typeof links.$inferInsert, 'id'>): Promise<void> {
  await db().insert(links).values({ id: newId(), sortOrder: Date.now() % 100000, ...input })
}

export async function updateLink(id: string, patch: Partial<Omit<Link, 'id'>>): Promise<void> {
  await db().update(links).set(patch).where(eq(links.id, id))
}

export async function deleteLink(id: string): Promise<void> {
  await db().delete(links).where(eq(links.id, id))
}
