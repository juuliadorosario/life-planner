import type { CalendarCategory } from '@/providers/calendar'

export const EVENT_LABEL: Record<CalendarCategory, string> = {
  school: 'School',
  study: 'Study',
  health: 'Health',
  startup: 'Startup',
  personal: 'Personal',
  exam: 'Exam',
}

/** Tinted block used in week/day views: a thin coloured edge on a faint wash. */
export const EVENT_BLOCK: Record<CalendarCategory, string> = {
  school: 'border-cat-school bg-cat-school/12',
  study: 'border-cat-study bg-cat-study/14',
  health: 'border-cat-health bg-cat-health/14',
  startup: 'border-cat-startup bg-cat-startup/14',
  personal: 'border-cat-personal bg-cat-personal/14',
  exam: 'border-cat-exam bg-cat-exam/12',
}
