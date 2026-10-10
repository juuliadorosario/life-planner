import { useQuery } from '@tanstack/react-query'
import { upsertChannelStat } from '@/db/repositories/marketing'
import { setSetting } from '@/db/repositories/settings'
import { queryClient } from '@/hooks/data'
import type { FunnelMonth } from '@/hooks/useSettings'

/**
 * Live numbers: an optional URL (Settings key `marketingLiveUrl`) that answers with
 * monthly counts as JSON, so the Website and Leads cards fill themselves in.
 *
 *   { "ok": true,
 *     "leads":  [{ "month": "2026-10", "value": 12 }],   // or null if not tracked
 *     "visits": [{ "month": "2026-10", "value": 340 }],  // or null if not tracked
 *     "funnel": [{ "month": "2026-10",                   // optional, steps in page order
 *                  "steps": [{ "id": "s:01:cover", "count": 300, "seconds": 2400 }] }] }
 *
 * Every answer is saved (channel_stats, and the funnel in Settings), so it all shows offline.
 */
type Point = { month: string; value: number }
type LiveAnswer = { ok?: boolean; error?: string; leads?: Point[] | null; visits?: Point[] | null; funnel?: unknown }

/** Which channel each list feeds. */
const FEEDS = [
  { list: 'visits', channel: 'web' },
  { list: 'leads', channel: 'leads' },
] as const

const isMonth = (m: unknown): m is FunnelMonth =>
  typeof m === 'object' &&
  m !== null &&
  /^\d{4}-\d{2}$/.test((m as FunnelMonth).month) &&
  Array.isArray((m as FunnelMonth).steps) &&
  (m as FunnelMonth).steps.every((s) => typeof s?.id === 'string' && Number.isFinite(s.count))

/** The funnel as last saved, so an unchanged answer doesn't rewrite Settings every minute. */
let savedFunnel = ''

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

  if (Array.isArray(answer.funnel)) {
    const funnel = answer.funnel.filter(isMonth)
    const text = JSON.stringify(funnel)
    if (text !== savedFunnel) {
      await setSetting('marketingFunnel', funnel)
      savedFunnel = text
      await queryClient.invalidateQueries({ queryKey: ['settings'] })
    }
  }
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
