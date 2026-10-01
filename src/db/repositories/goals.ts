import { asc, eq, gte } from 'drizzle-orm'
import { differenceInCalendarDays, max, parseISO, subDays } from 'date-fns'
import { db } from '../client'
import { goalMilestones, goals, habitLogs, habits, tasks } from '../schema'
import { toDay } from '@/lib/dates'
import { newId, type Goal, type GoalMilestone } from '@/types/domain'

/** How far back habit check-ins count toward a goal. */
const HABIT_WINDOW_DAYS = 28

interface HabitData {
  habits: (typeof habits.$inferSelect)[]
  logs: { habitId: string; date: string }[]
}

async function loadHabitData(): Promise<HabitData> {
  const since = toDay(subDays(new Date(), HABIT_WINDOW_DAYS - 1))
  const [h, logs] = await Promise.all([
    db().select().from(habits).where(eq(habits.archived, false)),
    db().select({ habitId: habitLogs.habitId, date: habitLogs.date }).from(habitLogs).where(gte(habitLogs.date, since)),
  ])
  return { habits: h, logs }
}

/**
 * Consistency of the goal's linked habits over the last four weeks (or since each habit was created):
 * check-ins against each habit's weekly target, averaged. Null when no habits are linked.
 */
function habitProgress(goalId: string, data: HabitData): number | null {
  const linked = data.habits.filter((h) => h.goalId === goalId)
  if (!linked.length) return null
  const now = new Date()
  const windowStart = subDays(now, HABIT_WINDOW_DAYS - 1)
  const scores = linked.map((h) => {
    const start = max([windowStart, parseISO(h.createdAt)])
    const days = differenceInCalendarDays(now, start) + 1
    const target = (h.targetPerWeek * days) / 7
    const done = data.logs.filter((l) => l.habitId === h.id && l.date >= toDay(start)).length
    return Math.min(1, done / target)
  })
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
}

export interface GoalWithProgress extends Goal {
  milestones: GoalMilestone[]
  /** Derived from milestones when there are any, else from linked habits, otherwise the manual value. */
  computedProgress: number
  openTasks: number
}

function withProgress(goal: Goal, milestones: GoalMilestone[], openTasks: number, habitData: HabitData): GoalWithProgress {
  const own = milestones.filter((m) => m.goalId === goal.id)
  const computedProgress = own.length
    ? Math.round((own.filter((m) => m.done).length / own.length) * 100)
    : (habitProgress(goal.id, habitData) ?? goal.progress)
  return { ...goal, milestones: own, computedProgress, openTasks }
}

export async function listGoals(): Promise<GoalWithProgress[]> {
  const [rows, milestones, taskRows, habitData] = await Promise.all([
    db().select().from(goals).orderBy(asc(goals.status), asc(goals.deadline)),
    db().select().from(goalMilestones).orderBy(asc(goalMilestones.sortOrder)),
    db().select({ goalId: tasks.goalId, status: tasks.status }).from(tasks),
    loadHabitData(),
  ])
  return rows.map((g) =>
    withProgress(g, milestones, taskRows.filter((t) => t.goalId === g.id && t.status !== 'done').length, habitData),
  )
}

export async function getGoal(id: string): Promise<GoalWithProgress | undefined> {
  const goal = await db().select().from(goals).where(eq(goals.id, id)).get()
  if (!goal) return undefined
  const milestones = await db().select().from(goalMilestones).where(eq(goalMilestones.goalId, id)).orderBy(asc(goalMilestones.sortOrder))
  return withProgress(goal, milestones, 0, await loadHabitData())
}

export async function createGoal(input: Omit<typeof goals.$inferInsert, 'id'>): Promise<Goal> {
  const [row] = await db().insert(goals).values({ id: newId(), ...input }).returning()
  return row
}

export async function updateGoal(id: string, patch: Partial<Omit<Goal, 'id'>>): Promise<void> {
  await db().update(goals).set(patch).where(eq(goals.id, id))
}

export async function deleteGoal(id: string): Promise<void> {
  await db().delete(goals).where(eq(goals.id, id))
}

export async function addMilestone(goalId: string, title: string): Promise<void> {
  await db().insert(goalMilestones).values({ id: newId(), goalId, title, sortOrder: Date.now() })
}

export async function setMilestoneDone(id: string, done: boolean): Promise<void> {
  await db().update(goalMilestones).set({ done }).where(eq(goalMilestones.id, id))
}

export async function deleteMilestone(id: string): Promise<void> {
  await db().delete(goalMilestones).where(eq(goalMilestones.id, id))
}
