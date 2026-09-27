import { eq } from 'drizzle-orm'
import { addDays, differenceInMinutes, isBefore, startOfDay } from 'date-fns'
import { db } from '@/db/client'
import { calendarEvents } from '@/db/schema'
import { newId } from '@/types/domain'
import type { CalendarEvent, CalendarProvider, DateRange, NewCalendarEvent } from './CalendarProvider'
import { personal } from '@/config/personal'

/** Events stored in LifeOS's own database, with simple weekly recurrence. */
export class LocalCalendarProvider implements CalendarProvider {
  readonly id = 'local'
  readonly name = `${personal.appName} calendar`

  async listEvents(range: DateRange): Promise<CalendarEvent[]> {
    const rows = await db().select().from(calendarEvents)
    const out: CalendarEvent[] = []
    for (const row of rows) {
      const start = new Date(row.start)
      const end = new Date(row.end)
      const base = {
        title: row.title,
        allDay: row.allDay,
        category: row.category,
        location: row.location,
        source: this.id,
        href: row.projectId ? `/projects/${row.projectId}` : undefined,
        editable: true,
      }
      if (!row.repeatWeekdays?.length) {
        if (end > range.start && start < range.end) out.push({ id: row.id, start, end, ...base })
        continue
      }
      // Expand the weekly recurrence inside the requested range, from the first occurrence on.
      const duration = differenceInMinutes(end, start)
      for (let day = startOfDay(range.start); isBefore(day, range.end); day = addDays(day, 1)) {
        if (isBefore(day, startOfDay(start)) || !row.repeatWeekdays.includes(day.getDay())) continue
        const s = new Date(day)
        s.setHours(start.getHours(), start.getMinutes(), 0, 0)
        const e = new Date(s.getTime() + duration * 60000)
        out.push({ id: `${row.id}:${s.toISOString().slice(0, 10)}`, start: s, end: e, ...base })
      }
    }
    return out
  }

  async createEvent(input: NewCalendarEvent): Promise<void> {
    await db()
      .insert(calendarEvents)
      .values({
        id: newId(),
        title: input.title,
        start: input.start.toISOString(),
        end: input.end.toISOString(),
        allDay: input.allDay ?? false,
        category: input.category,
        location: input.location ?? null,
        repeatWeekdays: input.repeatWeekdays ?? null,
      })
  }

  async deleteEvent(id: string): Promise<void> {
    // Occurrence ids look like `<id>:<date>`; deleting removes the whole series.
    await db().delete(calendarEvents).where(eq(calendarEvents.id, id.split(':')[0]))
  }
}
