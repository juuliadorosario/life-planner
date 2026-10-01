import { addDays, eachWeekOfInterval, endOfMonth, endOfWeek, format, startOfMonth } from 'date-fns'
import { CalendarCheck } from 'lucide-react'
import { Panel } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { useNow } from '@/hooks/useNow'
import { toDay } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { useFixedItems } from '../plan'
import { FixedRow } from './FixedRow'

const WEEK = { weekStartsOn: 1 } as const

/** The month's fixed dates, week by week, with the current week highlighted. Runs a week past month end so early-next-month deadlines show. */
export function MonthWidget() {
  const now = useNow()
  const first = startOfMonth(now)
  const last = addDays(endOfMonth(now), 7)
  const items = useFixedItems(toDay(first), toDay(last))
  const thisWeek = toDay(endOfWeek(now, WEEK))

  const weeks = eachWeekOfInterval({ start: first, end: last }, WEEK)
    .map((start) => {
      const end = endOfWeek(start, WEEK)
      const from = toDay(start)
      const to = toDay(end)
      return { start, end, current: to === thisWeek, items: items.filter((i) => i.date >= from && i.date <= to) }
    })
    .filter((w) => w.items.length || w.current)

  return (
    <Panel title={format(now, 'MMMM')} action={<span className="text-[12px] text-muted-foreground">Fixed dates</span>}>
      {items.length ? (
        <div className="flex flex-col gap-2">
          {weeks.map((w) => (
            <div key={w.start.toISOString()} className={cn('grid gap-x-4 rounded-lg px-3 py-2 sm:grid-cols-[92px_minmax(0,1fr)]', w.current ? 'bg-muted' : w.end < now && 'opacity-60')}>
              <div className="pt-1 text-[11px] tracking-wider text-muted-foreground uppercase">
                {w.current ? <span className="font-semibold text-foreground">This week</span> : `${format(w.start, 'd')}–${format(w.end, 'd MMM')}`}
              </div>
              <div>
                {w.items.length ? w.items.map((i) => <FixedRow key={i.key} item={i} />) : <p className="py-1 text-[13px] text-muted-foreground">Nothing fixed.</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState compact icon={CalendarCheck} title="No fixed dates this month." />
      )}
    </Panel>
  )
}
