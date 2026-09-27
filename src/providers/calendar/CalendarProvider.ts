import type { EventCategory } from '@/types/domain'

export type CalendarCategory = EventCategory | 'exam'

/** One event, whatever calendar it came from. */
export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  category: CalendarCategory
  location?: string | null
  /** Which provider produced it (`local`, `lifeos`, `apple`…). */
  source: string
  /** Human name of the calendar it came from, e.g. "iCloud · Home". */
  sourceLabel?: string
  /** In-app page for the object behind the event, if any. */
  href?: string
  editable: boolean
}

export interface DateRange {
  start: Date
  end: Date
}

export interface NewCalendarEvent {
  title: string
  start: Date
  end: Date
  allDay?: boolean
  category: EventCategory
  location?: string
  repeatWeekdays?: number[] | null
  /** Apple Calendar only: which calendar to save into (default calendar if omitted). */
  calendarId?: string
}

/**
 * A source of calendar events. LifeOS ships a local provider (SQLite) and a
 * derived one (exams, study sessions). An `AppleCalendarProvider` backed by
 * EventKit through a Tauri command will implement the same interface.
 */
export interface CalendarProvider {
  readonly id: string
  readonly name: string
  listEvents(range: DateRange): Promise<CalendarEvent[]>
  createEvent?(input: NewCalendarEvent): Promise<void>
  deleteEvent?(id: string): Promise<void>
}
