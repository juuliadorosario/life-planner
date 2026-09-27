import { invoke } from '@tauri-apps/api/core'
import type { EventCategory } from '@/types/domain'
import type { CalendarEvent, CalendarProvider, DateRange, NewCalendarEvent } from './CalendarProvider'

export type AppleCalendarStatus = 'not-determined' | 'denied' | 'restricted' | 'full' | 'write-only' | 'unknown'

export interface AppleCalendar {
  id: string
  title: string
  color: string | null
  writable: boolean
}

interface NativeEvent {
  id: string
  title: string
  start: number
  end: number
  allDay: boolean
  location: string | null
  calendarId: string | null
  calendarTitle: string | null
  calendarColor: string | null
}

/** LifeOS stays black & white, so Apple calendars map onto its grey categories by name. */
function categoryFor(calendarTitle: string | null): EventCategory {
  const t = (calendarTitle ?? '').toLowerCase()
  if (/school|institut|escola|class|uni|study|estudi/.test(t)) return 'school'
  if (/gym|sport|health|salut|fitness|workout/.test(t)) return 'health'
  if (/work|feina|startup|business|office/.test(t)) return 'startup'
  return 'personal'
}

/**
 * Apple Calendar on this Mac through EventKit (a native Tauri command).
 * Includes every account Calendar.app has: iCloud, Google, Exchange…
 */
export class AppleCalendarProvider implements CalendarProvider {
  readonly id = 'apple'
  readonly name = 'Apple Calendar'
  /** Calendar ids the user chose to hide (Settings). */
  hidden = new Set<string>()

  static status(): Promise<AppleCalendarStatus> {
    return invoke<AppleCalendarStatus>('calendar_status')
  }

  static requestAccess(): Promise<boolean> {
    return invoke<boolean>('calendar_request_access')
  }

  static calendars(): Promise<AppleCalendar[]> {
    return invoke<AppleCalendar[]>('calendar_list')
  }

  async listEvents(range: DateRange): Promise<CalendarEvent[]> {
    if ((await AppleCalendarProvider.status()) !== 'full') return []
    const events = await invoke<NativeEvent[]>('calendar_events', { start: range.start.getTime(), end: range.end.getTime() })
    return events
      .filter((e) => !e.calendarId || !this.hidden.has(e.calendarId))
      .map((e) => {
        const end = new Date(e.end)
        return {
          id: `apple:${e.id}`,
          title: e.title || '(No title)',
          start: new Date(e.start),
          // EventKit ends all-day events at the next midnight; keep them on their own day.
          end: e.allDay ? new Date(end.getTime() - 1) : end,
          allDay: e.allDay,
          category: categoryFor(e.calendarTitle),
          location: e.location,
          source: this.id,
          sourceLabel: e.calendarTitle ?? undefined,
          editable: false,
        }
      })
  }

  async createEvent(input: NewCalendarEvent): Promise<void> {
    await invoke('calendar_create_event', {
      event: {
        title: input.title,
        start: input.start.getTime(),
        end: input.end.getTime(),
        allDay: input.allDay ?? false,
        location: input.location ?? null,
        calendarId: input.calendarId ?? null,
      },
    })
  }
}
