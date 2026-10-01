import { useState } from 'react'
import { Card } from '@/components/common/Card'
import { Page, PageHeader } from '@/components/common/PageHeader'
import { getSetting, setSetting } from '@/db/repositories/settings'
import { useDbMutation, useDbQuery } from '@/hooks/data'
import { cn } from '@/lib/utils'

/**
 * The weekly school timetable, stored in the `schoolSchedule` setting.
 * Rows are time slots (classes and breaks), columns are Monday–Friday.
 * Click a class to rename it; leave it empty to clear it.
 */
interface Slot {
  start: string
  end: string
  kind: 'class' | 'break'
}

interface Schedule {
  slots: Slot[]
  /** One list per weekday (Mon–Fri), one entry per slot; breaks stay empty. */
  days: string[][]
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const EMPTY: Schedule = {
  slots: [
    { start: '08:00', end: '09:00', kind: 'class' },
    { start: '09:00', end: '10:00', kind: 'class' },
    { start: '10:00', end: '10:20', kind: 'break' },
    { start: '10:20', end: '11:20', kind: 'class' },
    { start: '11:20', end: '12:20', kind: 'class' },
    { start: '12:20', end: '12:40', kind: 'break' },
    { start: '12:40', end: '13:40', kind: 'class' },
    { start: '13:40', end: '14:40', kind: 'class' },
  ],
  days: DAYS.map(() => Array(8).fill('')),
}

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function SchedulePage() {
  const { data: schedule = EMPTY } = useDbQuery(['setting', 'schoolSchedule'], async () => (await getSetting<Schedule>('schoolSchedule')) ?? EMPTY)
  const save = useDbMutation((next: Schedule) => setSetting('schoolSchedule', next))
  const [editing, setEditing] = useState<string | null>(null)

  const now = new Date()
  const today = now.getDay() - 1 // 0 = Monday
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const rename = (day: number, slot: number, value: string) => {
    setEditing(null)
    if (value === schedule.days[day][slot]) return
    save.mutate({ ...schedule, days: schedule.days.map((d, i) => (i === day ? d.map((c, j) => (j === slot ? value : c)) : d)) })
  }

  return (
    <Page banner="schedule" bannerCount={4}>
      <PageHeader
        eyebrow="School"
        title="School schedule"
        description={`${schedule.slots[0].start} – ${schedule.slots[schedule.slots.length - 1].end}, Monday to Friday`}
      />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed border-collapse text-[14px]">
          <thead>
            <tr>
              <th className="w-[104px] border-b border-border px-4 py-3 text-left label-caps">Time</th>
              {DAYS.map((d, i) => (
                <th key={d} className={cn('border-b border-l border-border px-4 py-3 text-left label-caps', i === today && 'bg-foreground text-background')}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.slots.map((slot, s) => {
              const current = nowMin >= minutes(slot.start) && nowMin < minutes(slot.end)
              if (slot.kind === 'break')
                return (
                  <tr key={s}>
                    <td className="border-b border-border px-4 py-1.5 font-mono text-[11.5px] text-muted-foreground tabular">{slot.start}</td>
                    <td colSpan={DAYS.length} className="border-b border-l border-border bg-muted/40 px-4 py-1.5 text-center label-caps text-muted-foreground">
                      Break · 20 min
                    </td>
                  </tr>
                )
              return (
                <tr key={s}>
                  <td className="border-b border-border px-4 py-4 align-top font-mono text-[12px] text-muted-foreground tabular">
                    {slot.start}
                    <div className="text-faint">{slot.end}</div>
                  </td>
                  {DAYS.map((d, day) => {
                    const key = `${day}:${s}`
                    const name = schedule.days[day]?.[s] ?? ''
                    const live = current && day === today
                    return (
                      <td
                        key={d}
                        onClick={() => setEditing(key)}
                        className={cn(
                          'cursor-text border-b border-l border-border px-4 py-4 align-top transition-colors hover:bg-muted/50',
                          live && 'bg-foreground text-background hover:bg-foreground',
                        )}
                      >
                        {editing === key ? (
                          <input
                            autoFocus
                            defaultValue={name}
                            className="w-full bg-transparent font-medium outline-none"
                            onBlur={(e) => rename(day, s, e.target.value.trim())}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur()
                              if (e.key === 'Escape') setEditing(null)
                            }}
                          />
                        ) : (
                          <span className={cn('font-medium', !name && 'text-faint')}>{name || '—'}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </Page>
  )
}
