import { Link } from 'react-router'
import { format, isWithinInterval } from 'date-fns'
import { CategoryDot } from '@/components/common/CategoryDot'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/providers/calendar'

/** A vertical list of the day's events, with the current one highlighted. */
export function TodayTimeline({ events, compact }: { events: CalendarEvent[]; compact?: boolean }) {
  const now = useNow()
  const timed = events.filter((e) => !e.allDay)
  const allDay = events.filter((e) => e.allDay)
  const nextIndex = timed.findIndex((e) => e.end > now)

  return (
    <div className="flex flex-col">
      {allDay.map((e) => (
        <div key={e.id} className="mb-2 flex items-center gap-2 rounded-lg bg-muted/70 px-3 py-1.5 text-[12.5px]">
          <CategoryDot category={e.category} />
          <span className="truncate">{e.title}</span>
        </div>
      ))}
      {timed.map((e, i) => {
        const current = isWithinInterval(now, { start: e.start, end: e.end })
        const past = e.end <= now
        const Row = (
          <div
            className={cn(
              'group/ev relative flex items-baseline gap-4 rounded-lg px-2 transition-colors',
              compact ? 'py-1.5' : 'py-2',
              e.href && 'hover:bg-muted/70',
              past && 'opacity-45',
            )}
          >
            <span className={cn('w-11 shrink-0 text-[12.5px] tabular', current || i === nextIndex ? 'font-medium text-foreground' : 'text-muted-foreground')}>
              {format(e.start, 'HH:mm')}
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <CategoryDot category={e.category} className="translate-y-[-1px]" />
              <span className={cn('truncate text-[13.5px]', current && 'font-medium')}>{e.title}</span>
            </span>
            {current ? (
              <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">Now</span>
            ) : (
              !compact && (
                <span className="shrink-0 text-[12px] text-faint tabular">{format(e.end, 'HH:mm')}</span>
              )
            )}
          </div>
        )
        return e.href ? (
          <Link key={e.id} to={e.href}>
            {Row}
          </Link>
        ) : (
          <div key={e.id}>{Row}</div>
        )
      })}
    </div>
  )
}
