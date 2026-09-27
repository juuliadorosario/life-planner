import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Check } from 'lucide-react'
import { useToast } from '@/app/toast'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { db } from '@/db/client'
import { calendarEvents } from '@/db/schema'
import { useSetSetting, useSettings } from '@/hooks/useSettings'
import { AppleCalendarProvider, calendarService } from '@/providers/calendar'
import { useAppleCalendar } from './hooks'
import { personal } from '@/config/personal'

/** Keeps the provider's hidden-calendar list in sync with Settings. Mount once. */
export function useAppleCalendarSync() {
  const { appleHiddenCalendars } = useSettings()
  const qc = useQueryClient()
  useEffect(() => {
    if (!calendarService.apple) return
    calendarService.apple.hidden = new Set(appleHiddenCalendars)
    void qc.invalidateQueries({ queryKey: ['calendar'] })
  }, [appleHiddenCalendars, qc])
}

function useConnect() {
  const qc = useQueryClient()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const connect = async () => {
    setBusy(true)
    try {
      const granted = await AppleCalendarProvider.requestAccess()
      toast(granted ? 'Apple Calendar connected' : 'Access not granted')
    } finally {
      setBusy(false)
      await qc.invalidateQueries()
    }
  }
  return { connect, busy }
}

/** Small prompt shown on the Calendar page until Apple Calendar is connected. */
export function AppleCalendarBanner() {
  const { available, status } = useAppleCalendar()
  const { connect, busy } = useConnect()
  if (!available || !status || status === 'full') return null
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex items-center gap-3">
        <CalendarDays className="size-4 text-muted-foreground" strokeWidth={1.75} />
        <div>
          <div className="text-[13.5px] font-medium">Show your Apple Calendar here</div>
          <div className="text-[12.5px] text-muted-foreground">
            {status === 'denied'
              ? `Access was declined. Turn ${personal.appName} on in System Settings → Privacy & Security → Calendars.`
              : 'iCloud, Google and any other calendar on this Mac, next to your exams and study sessions.'}
          </div>
        </div>
      </div>
      {status !== 'denied' && (
        <Button size="sm" onClick={connect} disabled={busy}>
          {busy ? 'Waiting for macOS…' : 'Connect'}
        </Button>
      )}
    </div>
  )
}

/** Settings section: connection state, which calendars to show, demo clean-up. */
export function AppleCalendarSettings() {
  const { available, status, calendars } = useAppleCalendar()
  const { appleHiddenCalendars } = useSettings()
  const set = useSetSetting()
  const { connect, busy } = useConnect()
  const toast = useToast()
  const qc = useQueryClient()
  const [demoRemoved, setDemoRemoved] = useState(false)

  if (!available) return <p className="text-[12.5px] text-muted-foreground">Available in the {personal.appName} desktop app.</p>
  if (status !== 'full') {
    return (
      <div className="flex items-center justify-between gap-4">
        <span className="text-[12.5px] text-muted-foreground">
          {status === 'denied' ? `Access declined — enable ${personal.appName} in System Settings → Privacy & Security → Calendars.` : 'Not connected'}
        </span>
        {status !== 'denied' && (
          <Button size="sm" onClick={connect} disabled={busy}>
            {busy ? 'Waiting for macOS…' : 'Connect'}
          </Button>
        )}
      </div>
    )
  }

  const hidden = new Set(appleHiddenCalendars)
  return (
    <div className="flex flex-col gap-3">
      <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
        <Check className="size-3.5" /> Connected · choose which calendars to show
      </span>
      <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {calendars.map((c) => (
          <label key={c.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px]">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: c.color ?? 'var(--faint)' }} />
              <span className="truncate">{c.title}</span>
            </span>
            <Switch
              checked={!hidden.has(c.id)}
              onCheckedChange={(on) => {
                const next = new Set(hidden)
                if (on) next.delete(c.id)
                else next.add(c.id)
                set.mutate({ key: 'appleHiddenCalendars', value: [...next] })
              }}
            />
          </label>
        ))}
      </div>
      <div className="flex items-center justify-between gap-4 pt-1">
        <span className="text-[12.5px] text-muted-foreground">The school, gym and lunch blocks were demo events.</span>
        <Button
          variant="outline"
          size="sm"
          disabled={demoRemoved}
          onClick={async () => {
            await db().delete(calendarEvents)
            setDemoRemoved(true)
            await qc.invalidateQueries()
            toast('Demo events removed')
          }}
        >
          {demoRemoved ? 'Removed' : 'Remove demo events'}
        </Button>
      </div>
    </div>
  )
}
