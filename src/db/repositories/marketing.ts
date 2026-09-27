import { asc, eq } from 'drizzle-orm'
import { db } from '../client'
import { channelStats, marketingPosts } from '../schema'
import { newId } from '@/types/domain'

export type MarketingPost = typeof marketingPosts.$inferSelect
export type PostStatus = MarketingPost['status']

export async function listPosts() {
  return db().select().from(marketingPosts).orderBy(asc(marketingPosts.date), asc(marketingPosts.createdAt))
}

export async function createPost(input: { title: string; channel: string; date?: string | null; status?: PostStatus }) {
  await db().insert(marketingPosts).values({ id: newId(), ...input })
}

export async function updatePost(id: string, patch: Partial<Omit<MarketingPost, 'id'>>) {
  await db().update(marketingPosts).set(patch).where(eq(marketingPosts.id, id))
}

export async function deletePost(id: string) {
  await db().delete(marketingPosts).where(eq(marketingPosts.id, id))
}

export async function listChannelStats() {
  return db().select().from(channelStats).orderBy(asc(channelStats.month))
}

export async function upsertChannelStat(month: string, channel: string, value: number) {
  await db()
    .insert(channelStats)
    .values({ id: newId(), month, channel, value })
    .onConflictDoUpdate({ target: [channelStats.month, channelStats.channel], set: { value } })
}
