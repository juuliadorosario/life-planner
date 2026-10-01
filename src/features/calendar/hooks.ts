import { useQuery } from '@tanstack/react-query'
import { AppleCalendarProvider, calendarService, type DateRange, type NewCalendarEvent } from '@/providers/calendar'
import { AppleReminders } from '@/providers/calendar/AppleReminders'
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

/** Apple Reminders connection state (desktop app only). */
export function useRemindersStatus() {
  return useDbQuery(['apple-reminders-status'], () => AppleReminders.status(), AppleReminders.available)
}

/** Unfinished Apple reminders due in the range; `start: null` also brings everything overdue. */
export function useReminders(start: Date | null, end: Date) {
  const { data: status } = useRemindersStatus()
  // Reminders change outside the app too, so refresh like the calendar does.
  return useQuery({
    queryKey: ['reminders', start?.toISOString() ?? 'overdue', end.toISOString()],
    queryFn: () => AppleReminders.list(start, end),
    enabled: status === 'full',
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60_000,
  })
}

export function useCompleteReminder() {
  return useDbMutation(({ id, done }: { id: string; done: boolean }) => AppleReminders.setCompleted(id, done))
}
