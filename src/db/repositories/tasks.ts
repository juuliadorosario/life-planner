import { and, asc, desc, eq, gt, isNotNull, isNull, lte, ne, or, type SQL } from 'drizzle-orm'
import { db } from '../client'
import { tasks } from '../schema'
import { today } from '@/lib/dates'
import { newId, type NewTask, type Task } from '@/types/domain'

export type TaskView = 'today' | 'upcoming' | 'inbox' | 'completed' | 'all'

export interface TaskFilter {
  view?: TaskView
  projectId?: string
  subjectId?: string
  goalId?: string
  examId?: string
  areaId?: string
  /** Include completed tasks when filtering by a parent object. */
  includeDone?: boolean
}

export async function listTasks(filter: TaskFilter = {}): Promise<Task[]> {
  const where: (SQL | undefined)[] = []
  const t = today()
  switch (filter.view) {
    case 'today':
      // Overdue and due today, plus anything completed today (so it stays visible, crossed out).
      where.push(
        or(
          and(ne(tasks.status, 'done'), isNotNull(tasks.dueDate), lte(tasks.dueDate, t)),
          and(eq(tasks.status, 'done'), eq(tasks.dueDate, t)),
        ),
      )
      break
    case 'upcoming':
      where.push(ne(tasks.status, 'done'), gt(tasks.dueDate, t))
      break
    case 'inbox':
      where.push(ne(tasks.status, 'done'), isNull(tasks.dueDate), isNull(tasks.projectId))
      break
    case 'completed':
      where.push(eq(tasks.status, 'done'))
      break
    default:
      if (!filter.includeDone) where.push(ne(tasks.status, 'done'))
  }
  if (filter.projectId) where.push(eq(tasks.projectId, filter.projectId))
  if (filter.subjectId) where.push(eq(tasks.subjectId, filter.subjectId))
  if (filter.goalId) where.push(eq(tasks.goalId, filter.goalId))
  if (filter.examId) where.push(eq(tasks.examId, filter.examId))
  if (filter.areaId) where.push(eq(tasks.areaId, filter.areaId))

  const order =
    filter.view === 'completed'
      ? [desc(tasks.completedAt)]
      : [asc(tasks.status), asc(tasks.dueDate), desc(tasks.priority), asc(tasks.sortOrder)]
  return db()
    .select()
    .from(tasks)
    .where(and(...where))
    .orderBy(...order)
}

export async function createTask(input: Omit<NewTask, 'id'>): Promise<Task> {
  const [row] = await db()
    .insert(tasks)
    .values({ id: newId(), sortOrder: Date.now(), ...input })
    .returning()
  return row
}

export async function updateTask(id: string, patch: Partial<Omit<Task, 'id'>>): Promise<void> {
  await db().update(tasks).set(patch).where(eq(tasks.id, id))
}

export async function setTaskDone(id: string, done: boolean): Promise<void> {
  await updateTask(id, done ? { status: 'done', completedAt: new Date().toISOString() } : { status: 'todo', completedAt: null })
}

export async function deleteTask(id: string): Promise<void> {
  await db().delete(tasks).where(eq(tasks.id, id))
}
