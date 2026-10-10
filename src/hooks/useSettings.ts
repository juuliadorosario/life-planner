import { getAllSettings, setSetting } from '@/db/repositories/settings'
import { useDbMutation, useDbQuery } from './data'

/** One month of the website funnel: how many visits reached each step, and for how long. */
export type FunnelMonth = { month: string; steps: { id: string; count: number; seconds: number }[] }

export interface AppSettings {
  userName: string
  startupName: string
  currency: string
  quickNotes: string
  countdown: { title: string; date: string } | null
  intention: string
  quote: string
  reading: { title: string; author: string }
  coverStyle: 'camel' | 'black' | 'stone' | 'cream' | 'pink'
  /** Apple Calendar calendars the user chose not to show. */
  appleHiddenCalendars: string[]
  /** Areas the user doesn't use; hidden from the sidebar. */
  hiddenAreas: string[]
  /** Link that answers with live Website and Leads numbers (see features/startup/liveNumbers.ts). */
  marketingLiveUrl: string
  /** Anthropic API key for smart capture (see providers/ai/smartCapture.ts). Empty = AI off. */
  aiApiKey: string
  /** What the assistant knows about the user; it can add to this itself (see providers/ai/assistant.ts). */
  aiAbout: string
  /** Last website funnel the live link answered with, kept so it shows offline. */
  marketingFunnel: FunnelMonth[]
  /** First-run setup finished (or skipped). */
  onboarded: boolean
}

export function useSettings(): AppSettings {
  const { data } = useDbQuery(['settings'], getAllSettings)
  return {
    userName: (data?.userName as string) ?? '',
    startupName: (data?.startupName as string) ?? 'Startup',
    currency: (data?.currency as string) ?? 'EUR',
    quickNotes: (data?.quickNotes as string) ?? '',
    countdown: (data?.countdown as AppSettings['countdown']) ?? null,
    intention: (data?.intention as string) ?? 'I will grow intentionally — not just in knowledge, but in wisdom.',
    quote: (data?.quote as string) ?? 'Success is the product of daily habits, not once-in-a-lifetime transformations.',
    reading: (data?.reading as AppSettings['reading']) ?? { title: 'Atomic Habits', author: 'James Clear' },
    coverStyle: (data?.coverStyle as AppSettings['coverStyle']) ?? 'black',
    appleHiddenCalendars: (data?.appleHiddenCalendars as string[]) ?? [],
    hiddenAreas: (data?.hiddenAreas as string[]) ?? [],
    marketingLiveUrl: (data?.marketingLiveUrl as string) ?? '',
    aiApiKey: (data?.aiApiKey as string) ?? '',
    aiAbout: (data?.aiAbout as string) ?? '',
    marketingFunnel: (data?.marketingFunnel as FunnelMonth[]) ?? [],
    onboarded: Boolean(data?.onboarded),
  }
}

export function useSetSetting() {
  return useDbMutation(({ key, value }: { key: keyof AppSettings | 'hiddenAreas'; value: unknown }) => setSetting(key, value))
}

export function useMoney() {
  const { currency } = useSettings()
  return (value: number, opts: { decimals?: boolean } = {}) =>
    new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency,
      maximumFractionDigits: opts.decimals === false ? 0 : 2,
      minimumFractionDigits: opts.decimals === false ? 0 : 2,
    }).format(value)
}
