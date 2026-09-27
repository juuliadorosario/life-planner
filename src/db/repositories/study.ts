import { and, asc, eq, gte } from 'drizzle-orm'
import { db } from '../client'
import { assignments, exams, notes, studySessions, subjectTopics, subjects, tasks } from '../schema'
import { dayOffset, parseDay, today, toDay } from '@/lib/dates'
import { addDays } from 'date-fns'
import { newId, type Exam, type Subject, type SubjectTopic } from '@/types/domain'

export interface SubjectWithProgress extends Subject {
  topics: SubjectTopic[]
  progress: number
  nextExam?: Exam
}

export async function listSubjects(): Promise<SubjectWithProgress[]> {
  const [rows, topicRows, examRows] = await Promise.all([
    db().select().from(subjects).orderBy(asc(subjects.sortOrder)),
    db().select().from(subjectTopics).orderBy(asc(subjectTopics.sortOrder)),
    db().select().from(exams).where(and(eq(exams.status, 'upcoming'), gte(exams.date, today()))).orderBy(asc(exams.date)),
  ])
  return rows.map((s) => {
    const topics = topicRows.filter((t) => t.subjectId === s.id)
    return {
      ...s,
      topics,
      progress: topics.length ? Math.round((topics.filter((t) => t.done).length / topics.length) * 100) : 0,
      nextExam: examRows.find((e) => e.subjectId === s.id),
    }
  })
}

export async function createSubject(name: string): Promise<void> {
  await db().insert(subjects).values({ id: newId(), name, sortOrder: Date.now() })
}

export async function addTopic(subjectId: string, name: string): Promise<void> {
  await db().insert(subjectTopics).values({ id: newId(), subjectId, name, sortOrder: Date.now() })
}

export async function setTopicDone(id: string, done: boolean): Promise<void> {
  await db().update(subjectTopics).set({ done }).where(eq(subjectTopics.id, id))
}

export async function listExams(opts: { upcomingOnly?: boolean; subjectId?: string } = {}) {
  const where = and(
    opts.upcomingOnly ? and(eq(exams.status, 'upcoming'), gte(exams.date, today())) : undefined,
    opts.subjectId ? eq(exams.subjectId, opts.subjectId) : undefined,
  )
  return db().select().from(exams).where(where).orderBy(asc(exams.date))
}

export async function getExam(id: string) {
  return db().select().from(exams).where(eq(exams.id, id)).get()
}

/** Counts of everything attached to an exam — the "related" panel. */
export async function examRelations(id: string) {
  const [sessionRows, taskRows, noteRows] = await Promise.all([
    db().select().from(studySessions).where(eq(studySessions.examId, id)).orderBy(asc(studySessions.date)),
    db().select().from(tasks).where(eq(tasks.examId, id)),
    db().select().from(notes).where(eq(notes.examId, id)),
  ])
  return { sessions: sessionRows, tasks: taskRows, notes: noteRows }
}

export interface NewExamInput {
  title: string
  subjectId: string
  date: string
  time?: string
  location?: string
  topics: string[]
  /** Create study sessions and a revision task in the days before. */
  generatePlan: boolean
}

/**
 * An exam is more than a date: optionally it creates a study plan — sessions
 * spread over the previous days and one task per topic, all linked back.
 */
export async function createExam(input: NewExamInput): Promise<string> {
  const id = newId()
  await db().insert(exams).values({
    id,
    title: input.title,
    subjectId: input.subjectId,
    date: input.date,
    time: input.time || null,
    location: input.location || null,
    topics: input.topics,
  })
  if (input.generatePlan) {
    const examDay = parseDay(input.date)
    const offsets = [-6, -4, -2, -1].filter((o) => toDay(addDays(examDay, o)) >= today())
    await Promise.all(
      offsets.map((o, i) =>
        db().insert(studySessions).values({
          id: newId(),
          subjectId: input.subjectId,
          examId: id,
          title: i === offsets.length - 1 ? 'Final review' : `Study session ${i + 1}`,
          date: toDay(addDays(examDay, o)),
          startTime: '16:00',
          durationMin: 60,
        }),
      ),
    )
    const topicsToTask = input.topics.length ? input.topics : ['Review all topics']
    await Promise.all(
      topicsToTask.map((topic, i) =>
        db().insert(tasks).values({
          id: newId(),
          title: `Revise: ${topic}`,
          subjectId: input.subjectId,
          examId: id,
          dueDate: toDay(addDays(examDay, Math.max(-7 + i, -2))) < today() ? today() : toDay(addDays(examDay, Math.max(-7 + i, -2))),
          priority: 2,
          sortOrder: Date.now() + i,
        }),
      ),
    )
  }
  return id
}

export async function setExamDone(id: string, done: boolean): Promise<void> {
  await db().update(exams).set({ status: done ? 'done' : 'upcoming' }).where(eq(exams.id, id))
}

export async function deleteExam(id: string): Promise<void> {
  await db().delete(exams).where(eq(exams.id, id))
}

export async function listAssignments(subjectId?: string) {
  return db()
    .select()
    .from(assignments)
    .where(subjectId ? eq(assignments.subjectId, subjectId) : undefined)
    .orderBy(asc(assignments.done), asc(assignments.dueDate))
}

export async function setAssignmentDone(id: string, done: boolean): Promise<void> {
  await db().update(assignments).set({ done }).where(eq(assignments.id, id))
}

export async function createAssignment(input: { title: string; subjectId: string; dueDate?: string }): Promise<void> {
  await db().insert(assignments).values({ id: newId(), ...input })
}

export async function listStudySessions(opts: { from?: string; to?: string; subjectId?: string } = {}) {
  const rows = await db()
    .select()
    .from(studySessions)
    .where(opts.subjectId ? eq(studySessions.subjectId, opts.subjectId) : undefined)
    .orderBy(asc(studySessions.date), asc(studySessions.startTime))
  return rows.filter((s) => (!opts.from || s.date >= opts.from) && (!opts.to || s.date <= opts.to))
}

export async function createStudySession(input: { subjectId: string; examId?: string | null; title?: string; date: string; startTime?: string; durationMin: number }): Promise<void> {
  await db().insert(studySessions).values({ id: newId(), ...input })
}

export async function setStudySessionDone(id: string, done: boolean): Promise<void> {
  await db().update(studySessions).set({ done }).where(eq(studySessions.id, id))
}

/** Minutes studied per subject over the last `days` days. */
export async function studyMinutesBySubject(days = 7) {
  const from = dayOffset(-days + 1)
  const rows = await listStudySessions({ from, to: today() })
  const map = new Map<string, number>()
  for (const s of rows) if (s.done && s.subjectId) map.set(s.subjectId, (map.get(s.subjectId) ?? 0) + s.durationMin)
  return map
}

