import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useUI } from '@/app/ui-state'
import { Card } from '@/components/common/Card'
import { CategoryDot } from '@/components/common/CategoryDot'
import { EmptyState } from '@/components/common/EmptyState'
import { Page } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { useNow } from '@/hooks/useNow'
import { parseDay, toDay } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { calendarService, type CalendarEvent } from '@/providers/calendar'
import { AppleCalendarBanner } from './AppleCalendarConnect'
import { EVENT_BLOCK } from './eventStyle'
import { useCalendarEvents } from './hooks'
import { CalendarReminders } from './Reminders'

type View = 'month' | 'week' | 'day' | 'agenda'
const VIEWS: View[] = ['month', 'week', 'day', 'agenda']

const HOUR_PX = 52
const FIRST_HOUR = 7
const LAST_HOUR = 24

function rangeFor(view: View, date: Date) {
  switch (view) {
    case 'month':
      return { start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }) }
    case 'week':
      return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) }
    case 'day':
      return { start: startOfDay(date), end: endOfDay(date) }
    case 'agenda':
      return { start: startOfDay(date), end: endOfDay(addDays(date, 20)) }
  }
}

function EventLink({ event, className, style, children }: { event: CalendarEvent; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return event.href ? (
    <Link to={event.href} className={className} style={style} title={event.title}>
      {children}
    </Link>
  ) : (
    <div className={className} style={style} title={event.title}>
      {children}
    </div>
  )
}

function MonthView({ date, events, onPick }: { date: Date; events: CalendarEvent[]; onPick: (d: Date) => void }) {
  const range = rangeFor('month', date)
  const days = eachDayOfInterval(range)
  const now = new Date()
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="px-3 py-2.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const dayEvents = events.filter((e) => isSameDay(e.start, d))
          const today = isSameDay(d, now)
          return (
            <button
              key={d.toISOString()}
              onClick={() => onPick(d)}
              className={cn(
                'flex min-h-[118px] flex-col gap-1 border-border p-2 text-left transition-colors hover:bg-muted/40',
                i % 7 !== 6 && 'border-r',
                i < days.length - 7 && 'border-b',
                !isSameMonth(d, date) && 'bg-muted/25',
              )}
            >
              <span
                className={cn(
                  'grid size-6 place-items-center rounded-full text-[12.5px] tabular',
                  today ? 'bg-foreground font-medium text-background' : isSameMonth(d, date) ? 'text-foreground' : 'text-faint',
                )}
              >
                {format(d, 'd')}
              </span>
              {dayEvents.slice(0, 3).map((e) => (
                <span key={e.id} className="flex items-center gap-1.5 truncate text-[11.5px] text-muted-foreground">
                  <CategoryDot category={e.category} />
                  {!e.allDay && <span className="tabular text-faint">{format(e.start, 'HH:mm')}</span>}
                  <span className={cn('truncate', e.category === 'exam' && 'font-medium text-foreground')}>{e.title}</span>
                </span>
              ))}
              {dayEvents.length > 3 && <span className="pl-3 text-[11px] text-faint">+{dayEvents.length - 3} more</span>}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

/** Lay out overlapping events side by side. */
function layout(events: CalendarEvent[]) {
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime())
  const placed: { event: CalendarEvent; col: number; cols: number }[] = []
  let cluster: typeof placed = []
  let clusterEnd = 0
  const flush = () => {
    const cols = Math.max(1, ...cluster.map((p) => p.col + 1))
    cluster.forEach((p) => (p.cols = cols))
    cluster = []
  }
  for (const event of sorted) {
    if (event.start.getTime() >= clusterEnd) flush()
    const used = new Set(cluster.filter((p) => p.event.end > event.start).map((p) => p.col))
    let col = 0
    while (used.has(col)) col++
    const p = { event, col, cols: 1 }
    cluster.push(p)
    placed.push(p)
    clusterEnd = Math.max(clusterEnd, event.end.getTime())
  }
  flush()
  return placed
}

function TimeGrid({ days, events }: { days: Date[]; events: CalendarEvent[] }) {
  const now = useNow()
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i)
  const top = (d: Date) => ((d.getHours() + d.getMinutes() / 60 - FIRST_HOUR) * HOUR_PX)
  return (
    <Card className="overflow-hidden">
      <div className="grid border-b border-border" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
        <div />
        {days.map((d) => {
          const allDay = events.filter((e) => e.allDay && isSameDay(e.start, d))
          const today = isSameDay(d, now)
          return (
            <div key={d.toISOString()} className="border-l border-border px-3 py-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{format(d, 'EEE')}</span>
                <span className={cn('text-[15px] font-semibold tabular', today && 'text-primary')}>{format(d, 'd')}</span>
              </div>
              {allDay.map((e) => (
                <EventLink key={e.id} event={e} className="mt-1 block truncate rounded-md bg-muted px-1.5 py-0.5 text-[11px]">
                  {e.title}
                </EventLink>
              ))}
            </div>
          )
        })}
      </div>
      <div className="max-h-[calc(100svh-260px)] overflow-y-auto">
        <div className="relative grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)`, height: hours.length * HOUR_PX }}>
          <div className="relative">
            {hours.map((h) => (
              <div key={h} className="absolute right-2 -translate-y-1/2 text-[10.5px] text-faint tabular" style={{ top: (h - FIRST_HOUR) * HOUR_PX }}>
                {h > FIRST_HOUR && `${String(h).padStart(2, '0')}:00`}
              </div>
            ))}
          </div>
          {days.map((d) => {
            const dayEvents = layout(events.filter((e) => !e.allDay && isSameDay(e.start, d)))
            return (
              <div key={d.toISOString()} className="relative border-l border-border">
                {hours.map((h) => (
                  <div key={h} className="absolute inset-x-0 border-t border-border/60" style={{ top: (h - FIRST_HOUR) * HOUR_PX }} />
                ))}
                {dayEvents.map(({ event: e, col, cols }) => {
                  const t = Math.max(0, top(e.start))
                  const h = Math.max(22, top(e.end) - t - 2)
                  return (
                    <EventLink
                      key={e.id}
                      event={e}
                      className={cn('absolute overflow-hidden rounded-md border-l-2 px-2 py-1 text-[11.5px] leading-tight transition-[filter] hover:brightness-95', EVENT_BLOCK[e.category])}
                      style={{ top: t, height: h, left: `calc(${(col / cols) * 100}% + 2px)`, width: `calc(${100 / cols}% - 4px)` }}
                    >
                      <span className="block truncate font-medium text-foreground">{e.title}</span>
                      {h > 34 && <span className="block text-muted-foreground tabular">{format(e.start, 'HH:mm')}–{format(e.end, 'HH:mm')}</span>}
                    </EventLink>
                  )
                })}
                {isSameDay(d, now) && now.getHours() >= FIRST_HOUR && (
                  <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: top(now) }}>
                    <span className="-ml-1 size-2 rounded-full bg-primary" />
                    <span className="h-px flex-1 bg-primary" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

function AgendaView({ events }: { events: CalendarEvent[] }) {
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of events) map.set(toDay(e.start), [...(map.get(toDay(e.start)) ?? []), e])
    return [...map.entries()]
  }, [events])
  if (!byDay.length) return <Card className="p-6"><EmptyState icon={CalendarDays} title="Nothing coming up." /></Card>
  return (
    <Card className="divide-y divide-border">
      {byDay.map(([day, items]) => (
        <section key={day} className="flex gap-8 px-6 py-5">
          <div className="w-24 shrink-0">
            <div className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{format(parseDay(day), 'EEEE')}</div>
            <div className="text-[20px] figure tabular">{format(parseDay(day), 'MMM d')}</div>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            {items.map((e) => (
              <EventLink key={e.id} event={e} className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-1.5 hover:bg-muted/60">
                <span className="w-24 shrink-0 text-[12.5px] text-muted-foreground tabular">{e.allDay ? 'All day' : `${format(e.start, 'HH:mm')} – ${format(e.end, 'HH:mm')}`}</span>
                <CategoryDot category={e.category} />
                <span className={cn('truncate text-[13.5px]', e.category === 'exam' && 'font-medium')}>{e.title}</span>
                {e.location && <span className="truncate text-[12px] text-faint">{e.location}</span>}
              </EventLink>
            ))}
          </div>
        </section>
      ))}
    </Card>
  )
}

export function CalendarPage() {
  const [params, setParams] = useSearchParams()
  const view = (VIEWS.includes(params.get('view') as View) ? params.get('view') : 'week') as View
  const date = params.get('date') ? parseDay(params.get('date')!) : new Date()
  const dateKey = toDay(date)
  const range = useMemo(() => rangeFor(view, parseDay(dateKey)), [view, dateKey])
  const { data: events = [] } = useCalendarEvents(range)
  const { openDialog } = useUI()

  const set = (next: { view?: View; date?: Date }) =>
    setParams({ view: next.view ?? view, date: toDay(next.date ?? date) })
  const step = (dir: 1 | -1) => {
    const d = view === 'month' ? addMonths(date, dir) : view === 'week' ? addWeeks(date, dir) : view === 'day' ? addDays(date, dir) : addDays(date, dir * 14)
    set({ date: d })
  }
  const title =
    view === 'month' ? format(date, 'MMMM yyyy') : view === 'week' ? `${format(range.start, 'MMM d')} – ${format(range.end, isSameMonth(range.start, range.end) ? 'd' : 'MMM d')}` : view === 'day' ? format(date, 'EEEE, MMMM d') : 'Agenda'

  return (
    <Page wide>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="min-w-[200px] text-[24px] font-semibold tracking-[-0.02em]">{title}</h1>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon-sm" onClick={() => step(-1)} aria-label="Previous">
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => set({ date: new Date() })}>
              Today
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => step(1)} aria-label="Next">
              <ChevronRight />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-muted p-0.5">
            {VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => set({ view: v })}
                className={cn('h-7 rounded-md px-3 text-[12.5px] capitalize transition-colors', v === view ? 'bg-card font-medium text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground')}
              >
                {v}
              </button>
            ))}
          </div>
          <Button onClick={() => openDialog('event')}>
            <Plus /> Event
          </Button>
        </div>
      </header>

      <AppleCalendarBanner />
      {view === 'month' && <MonthView date={date} events={events} onPick={(d) => set({ view: 'day', date: d })} />}
      {view === 'week' && <TimeGrid days={eachDayOfInterval(range)} events={events} />}
      {view === 'day' && <TimeGrid days={[date]} events={events} />}
      {view === 'agenda' && <AgendaView events={events} />}
      <CalendarReminders start={range.start} end={range.end} />

      <p className="mt-4 text-[12px] text-faint">
        Sources: {calendarService.list().map((p) => p.name).join(' · ')}.
      </p>
    </Page>
  )
}
