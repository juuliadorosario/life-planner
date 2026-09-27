import { isTauri } from '@/providers/storage/StorageProvider'
import { AppleCalendarProvider } from './AppleCalendarProvider'
import type { CalendarEvent, CalendarProvider, DateRange } from './CalendarProvider'
import { LifeOSCalendarProvider } from './LifeOSCalendarProvider'
import { LocalCalendarProvider } from './LocalCalendarProvider'

export * from './CalendarProvider'
export { AppleCalendarProvider } from './AppleCalendarProvider'
export type { AppleCalendar, AppleCalendarStatus } from './AppleCalendarProvider'

/**
 * Merges every registered provider into one timeline. To add Apple Calendar,
 * implement `CalendarProvider` and register it here.
 */
class CalendarService {
  readonly local = new LocalCalendarProvider()
  /** Present only in the desktop app. */
  readonly apple = isTauri() ? new AppleCalendarProvider() : null
  private providers: CalendarProvider[] = [this.local, new LifeOSCalendarProvider(), ...(this.apple ? [this.apple] : [])]

  register(provider: CalendarProvider) {
    this.providers = [...this.providers.filter((p) => p.id !== provider.id), provider]
  }

  list(): readonly CalendarProvider[] {
    return this.providers
  }

  async listEvents(range: DateRange): Promise<CalendarEvent[]> {
    const results = await Promise.allSettled(this.providers.map((p) => p.listEvents(range)))
    return results
      .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }
}

export const calendarService = new CalendarService()
