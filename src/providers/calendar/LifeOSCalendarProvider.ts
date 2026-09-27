import { toDay } from '@/lib/dates'
import { listAssignments, listExams, listStudySessions, listSubjects } from '@/db/repositories/study'
import type { CalendarEvent, CalendarProvider, DateRange } from './CalendarProvider'

/**
 * Events that come from other LifeOS objects rather than being stored as
 * events: exams, study sessions and assignment deadlines. They appear on the
 * calendar automatically and link back to their source.
 */
export class LifeOSCalendarProvider implements CalendarProvider {
  readonly id = 'lifeos'
  readonly name = 'Study & deadlines'

  async listEvents(range: DateRange): Promise<CalendarEvent[]> {
    const from = toDay(range.start)
    const to = toDay(range.end)
    const [exams, sessions, assignments, subjects] = await Promise.all([
      listExams(),
      listStudySessions({ from, to }),
      listAssignments(),
      listSubjects(),
    ])
    const subjectName = (id: string | null) => subjects.find((s) => s.id === id)?.name ?? 'Study'
    const out: CalendarEvent[] = []

    for (const e of exams) {
      if (e.date < from || e.date > to) continue
      const start = new Date(`${e.date}T${e.time ?? '09:00'}:00`)
      out.push({
        id: `exam:${e.id}`,
        title: e.title,
        start,
        end: new Date(start.getTime() + 90 * 60000),
        allDay: !e.time,
        category: 'exam',
        location: e.location,
        source: this.id,
        href: `/study/exams/${e.id}`,
        editable: false,
      })
    }
    for (const s of sessions) {
      const start = new Date(`${s.date}T${s.startTime ?? '16:00'}:00`)
      out.push({
        id: `session:${s.id}`,
        title: `Study — ${subjectName(s.subjectId)}${s.title ? `: ${s.title}` : ''}`,
        start,
        end: new Date(start.getTime() + s.durationMin * 60000),
        allDay: !s.startTime,
        category: 'study',
        source: this.id,
        href: s.examId ? `/study/exams/${s.examId}` : `/study/subjects/${s.subjectId}`,
        editable: false,
      })
    }
    for (const a of assignments) {
      if (!a.dueDate || a.done || a.dueDate < from || a.dueDate > to) continue
      const start = new Date(`${a.dueDate}T00:00:00`)
      out.push({
        id: `assignment:${a.id}`,
        title: `Due: ${a.title}`,
        start,
        end: start,
        allDay: true,
        category: 'school',
        source: this.id,
        href: `/study/subjects/${a.subjectId}`,
        editable: false,
      })
    }
    return out
  }
}
