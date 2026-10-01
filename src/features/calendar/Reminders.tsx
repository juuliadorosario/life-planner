import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { endOfDay, format, isSameDay, startOfDay } from 'date-fns'
import { Bell } from 'lucide-react'
import { useToast } from '@/app/toast'
import { Card, CardHeader } from '@/components/common/Card'
import { CheckCircle } from '@/components/common/CheckCircle'
import { parseDay, relativeDay, toDay } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { AppleReminders, type Reminder } from '@/providers/calendar/AppleReminders'
import { personal } from '@/config/personal'
import { useCompleteReminder, useReminders, useRemindersStatus } from './hooks'

function ReminderRow({ reminder, showDay, dense }: { reminder: Reminder; showDay?: boolean; dense?: boolean }) {
  const complete = useCompleteReminder()
  // Local state so the check + strike-through happen before Reminders answers.
  const [done, setDone] = useState(false)
  const overdue = !!reminder.due && reminder.due < (reminder.allDay ? startOfDay(new Date()) : new Date())
  const when = reminder.due && [showDay || overdue ? relativeDay(toDay(reminder.due)) : null, reminder.allDay ? null : format(reminder.due, 'HH:mm')].filter(Boolean).join(' · ')
  return (
    <div className={cn('-mx-2 flex items-start gap-3 rounded-lg px-2', dense ? 'py-1.5' : 'py-2')}>
      <CheckCircle
        checked={done}
        className="mt-[1px]"
        label="Mark reminder as done"
        onChange={(v) => {
          setDone(v)
          complete.mutate({ id: reminder.id, done: v }, { onError: () => setDone(!v) })
        }}
      />
      <div className="min-w-0 flex-1">
        <div className={cn('truncate text-[13.5px] leading-5 transition-colors duration-300', done ? 'text-muted-foreground line-through decoration-faint' : 'text-foreground')}>
          {reminder.title || '(No title)'}
        </div>
        {!dense && (when || reminder.listTitle) && (
          <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted-foreground">
            {when && <span className={cn('tabular', overdue && !done && 'text-destructive')}>{when}</span>}
            {reminder.listTitle && <span className="truncate">{reminder.listTitle}</span>}
          </div>
        )}
      </div>
      {dense && when && <span className={cn('mt-[2px] shrink-0 text-[12px] text-muted-foreground tabular', overdue && !done && 'text-destructive')}>{when}</span>}
    </div>
  )
}

/** Asks macOS for Reminders access; renders nothing once connected or outside the desktop app. */
function RemindersConnect() {
  const { data: status } = useRemindersStatus()
  const qc = useQueryClient()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  if (!AppleReminders.available || !status || status === 'full') return null
  if (status === 'denied')
    return <p className="text-[12.5px] text-muted-foreground">Access declined — enable {personal.appName} in System Settings → Privacy & Security → Reminders.</p>
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          const granted = await AppleReminders.requestAccess()
          // macOS can keep reporting the old status until relaunch; trust the answer.
          if (granted) qc.setQueryData(['apple-reminders-status'], 'full')
          toast(granted ? 'Reminders connected' : 'Access not granted')
        } finally {
          setBusy(false)
          await qc.invalidateQueries({ queryKey: ['reminders'] })
        }
      }}
      className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Bell className="size-3.5" strokeWidth={1.75} />
      {busy ? 'Waiting for macOS…' : 'Show your Apple Reminders'}
    </button>
  )
}

/** Today's reminders plus anything overdue, for the Home tasks widget. */
export function TodayReminders() {
  const end = useMemo(() => endOfDay(new Date()), [])
  const { data: found = [], isPending, error } = useReminders(null, end)
  const { data: status } = useRemindersStatus()
  // Today's first, then the most recently overdue, so old leftovers don't crowd the day.
  const reminders = useMemo(() => {
    const start = startOfDay(new Date())
    const today = found.filter((r) => r.due && r.due >= start)
    const overdue = found.filter((r) => r.due && r.due < start).reverse()
    return [...today, ...overdue]
  }, [found])
  if (!AppleReminders.available) return null
  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="label-caps">Reminders</span>
        {reminders.length > 0 && <span className="text-[12px] text-muted-foreground tabular">{reminders.length}</span>}
      </div>
      <RemindersConnect />
      {status === 'full' && (error ? (
        <p className="py-1.5 text-[12.5px] text-destructive">Couldn't read Reminders: {String(error)}</p>
      ) : isPending ? (
        <p className="py-1.5 text-[12.5px] text-muted-foreground">Loading…</p>
      ) : (
        !reminders.length && <p className="py-1.5 text-[12.5px] text-muted-foreground">No reminders for today.</p>
      ))}
      {reminders.slice(0, 7).map((r) => (
        <ReminderRow key={r.id} reminder={r} dense />
      ))}
    </div>
  )
}

/** The reminders due in the visible range, listed under the calendar. */
export function CalendarReminders({ start, end }: { start: Date; end: Date }) {
  const now = new Date()
  // When the range reaches today, also show what is still overdue.
  const includesOverdue = start <= endOfDay(now) && end >= startOfDay(now)
  const { data: reminders = [] } = useReminders(includesOverdue ? null : start, end)
  const { data: status } = useRemindersStatus()
  const byDay = useMemo(() => {
    const map = new Map<string, Reminder[]>()
    for (const r of reminders) {
      const key = !r.due ? 'none' : r.due < startOfDay(now) ? 'overdue' : toDay(r.due)
      map.set(key, [...(map.get(key) ?? []), r])
    }
    return [...map.entries()]
  }, [reminders])
  if (!AppleReminders.available) return null

  return (
    <Card className="mt-6 p-5">
      <CardHeader title="Reminders" action={status === 'full' && <span className="text-[12px] text-muted-foreground tabular">{reminders.length} open</span>} />
      <div className="mt-2">
        <RemindersConnect />
        {status === 'full' && !reminders.length && <p className="py-1.5 text-[12.5px] text-muted-foreground">No reminders in these days.</p>}
        {byDay.map(([day, items]) => (
          <section key={day} className="flex gap-8 py-2">
            <div className={cn('w-24 shrink-0 pt-2 text-[11px] font-medium tracking-wider uppercase', day === 'overdue' ? 'text-destructive' : 'text-muted-foreground')}>
              {day === 'overdue' ? 'Overdue' : day === 'none' ? 'No date' : isSameDay(parseDay(day), now) ? 'Today' : format(parseDay(day), 'EEE d MMM')}
            </div>
            <div className="min-w-0 flex-1">
              {items.map((r) => (
                <ReminderRow key={r.id} reminder={r} showDay={day === 'overdue'} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Card>
  )
}
