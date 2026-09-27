import { useMemo } from 'react'
import { Link } from 'react-router'
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'
import { Card } from '@/components/common/Card'
import { useCalendarEvents } from '@/features/calendar/hooks'
import { toDay } from '@/lib/dates'
import { cn } from '@/lib/utils'

export function CalendarWidget() {
  const now = new Date()
  const range = useMemo(() => {
    const start = startOfWeek(startOfMonth(new Date()), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(new Date()), { weekStartsOn: 1 })
    return { start, end }
  }, [])
  const { data: events = [] } = useCalendarEvents(range)
  const days = eachDayOfInterval(range)
  // Only mark days with something beyond the everyday routine.
  const marked = new Set(events.filter((e) => e.category === 'exam' || e.source !== 'local' || !e.id.includes(':')).map((e) => toDay(e.start)))
  const exams = new Set(events.filter((e) => e.category === 'exam').map((e) => toDay(e.start)))

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <Link to="/calendar" className="display text-title-soft text-[20px] hover:text-primary">
          {format(now, 'MMMM')}
        </Link>
        <span className="text-[13px] text-muted-foreground tabular">{format(now, 'yyyy')}</span>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-y-1 text-center">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="pb-1 text-[10.5px] font-medium text-faint">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const today = isSameDay(d, now)
          const key = toDay(d)
          return (
            <Link
              key={key}
              to={`/calendar?view=day&date=${key}`}
              className={cn(
                'relative mx-auto grid size-8 place-items-center rounded-full text-[12.5px] tabular transition-colors',
                !isSameMonth(d, now) && 'text-faint/70',
                today ? 'bg-foreground font-medium text-background' : 'hover:bg-muted',
              )}
            >
              {format(d, 'd')}
              {marked.has(key) && !today && (
                <span className={cn('absolute bottom-[3px] size-1 rounded-full', exams.has(key) ? 'bg-cat-exam' : 'bg-primary/70')} />
              )}
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
