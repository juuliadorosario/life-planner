import { useQuery } from '@tanstack/react-query'
import { AppleCalendarProvider, calendarService, type DateRange, type NewCalendarEvent } from '@/providers/calendar'
import { useDbMutation, useDbQuery } from '@/hooks/data'

export function useCalendarEvents(range: DateRange) {
  // Apple Calendar changes outside LifeOS, so these refresh on focus and every few minutes.
  return useQuery({
    queryKey: ['calendar', range.start.toISOString(), range.end.toISOString()],
    queryFn: () => calendarService.listEvents(range),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60_000,
  })
}

export function useCalendarActions() {
  return {
    create: useDbMutation(({ target, ...input }: NewCalendarEvent & { target?: 'local' | 'apple' }) =>
      target === 'apple' && calendarService.apple ? calendarService.apple.createEvent(input) : calendarService.local.createEvent(input),
    ),
    remove: useDbMutation((id: string) => calendarService.local.deleteEvent(id)),
  }
}

/** Apple Calendar connection state (desktop app only). */
export function useAppleCalendar() {
  const enabled = !!calendarService.apple
  const status = useDbQuery(['apple-calendar-status'], () => AppleCalendarProvider.status(), enabled)
  const calendars = useDbQuery(['apple-calendars'], () => AppleCalendarProvider.calendars(), enabled && status.data === 'full')
  return { available: enabled, status: status.data, calendars: calendars.data ?? [] }
}
