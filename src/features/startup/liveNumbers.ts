import { useQuery } from '@tanstack/react-query'
import { upsertChannelStat } from '@/db/repositories/marketing'
import { queryClient } from '@/hooks/data'

/**
 * Live numbers: an optional URL (Settings key `marketingLiveUrl`) that answers with
 * monthly counts as JSON, so the Website and Leads cards fill themselves in.
 *
 *   { "ok": true,
 *     "leads":  [{ "month": "2026-10", "value": 12 }],   // or null if not tracked
 *     "visits": [{ "month": "2026-10", "value": 340 }] } // or null if not tracked
 *
 * Every answer is saved into channel_stats, so the cards keep their history offline.
 */
type Point = { month: string; value: number }
type LiveAnswer = { ok?: boolean; error?: string; leads?: Point[] | null; visits?: Point[] | null }

/** Which channel each list feeds. */
const FEEDS = [
  { list: 'visits', channel: 'web' },
  { list: 'leads', channel: 'leads' },
] as const

const isPoint = (p: unknown): p is Point =>
  typeof p === 'object' && p !== null && /^\d{4}-\d{2}$/.test((p as Point).month) && Number.isFinite((p as Point).value)

export async function syncLiveNumbers(url: string) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`The link answered ${res.status}`)
  let answer: LiveAnswer
  try {
    answer = await res.json()
  } catch {
    throw new Error('The link did not answer with numbers')
  }
  if (!answer.ok) throw new Error(answer.error === 'forbidden' ? 'The link was refused: check it is complete' : 'The link did not answer with numbers')

  const channels: string[] = []
  for (const feed of FEEDS) {
    const points = answer[feed.list]
    if (!Array.isArray(points)) continue
    channels.push(feed.channel)
    for (const p of points.filter(isPoint)) await upsertChannelStat(`${p.month}-01`, feed.channel, p.value)
  }
  await queryClient.invalidateQueries({ queryKey: ['channel-stats'] })
  return { channels, at: new Date() }
}

/** Reads the link now, every minute, and whenever the window comes back into focus. */
export function useLiveNumbers(url: string) {
  return useQuery({
    queryKey: ['live-numbers', url],
    queryFn: () => syncLiveNumbers(url),
    enabled: Boolean(url),
    staleTime: 0,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
}
