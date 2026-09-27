import { useMemo } from 'react'
import { endOfDay, startOfDay } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { Panel } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { useCalendarEvents } from '@/features/calendar/hooks'
import { TodayTimeline } from '@/features/calendar/TodayTimeline'

export function ScheduleWidget() {
  const range = useMemo(() => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }), [])
  const { data: events = [] } = useCalendarEvents(range)
  return (
    <Panel title="Today's focus" href="/today">
      {events.length ? (
        <TodayTimeline events={events} />
      ) : (
        <EmptyState compact icon={CalendarDays} title="A free day." description="Nothing on the calendar today." />
      )}
    </Panel>
  )
}
