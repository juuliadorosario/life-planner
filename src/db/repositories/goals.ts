import { asc, eq } from 'drizzle-orm'
import { db } from '../client'
import { goalMilestones, goals, tasks } from '../schema'
import { newId, type Goal, type GoalMilestone } from '@/types/domain'

export interface GoalWithProgress extends Goal {
  milestones: GoalMilestone[]
  /** Derived from milestones when there are any, otherwise the manual value. */
  computedProgress: number
  openTasks: number
}

function withProgress(goal: Goal, milestones: GoalMilestone[], openTasks: number): GoalWithProgress {
  const own = milestones.filter((m) => m.goalId === goal.id)
  const computedProgress = own.length
    ? Math.round((own.filter((m) => m.done).length / own.length) * 100)
    : goal.progress
  return { ...goal, milestones: own, computedProgress, openTasks }
}

export async function listGoals(): Promise<GoalWithProgress[]> {
  const [rows, milestones, taskRows] = await Promise.all([
    db().select().from(goals).orderBy(asc(goals.status), asc(goals.deadline)),
    db().select().from(goalMilestones).orderBy(asc(goalMilestones.sortOrder)),
    db().select({ goalId: tasks.goalId, status: tasks.status }).from(tasks),
  ])
  return rows.map((g) =>
    withProgress(g, milestones, taskRows.filter((t) => t.goalId === g.id && t.status !== 'done').length),
  )
}

export async function getGoal(id: string): Promise<GoalWithProgress | undefined> {
  const goal = await db().select().from(goals).where(eq(goals.id, id)).get()
  if (!goal) return undefined
  const milestones = await db().select().from(goalMilestones).where(eq(goalMilestones.goalId, id)).orderBy(asc(goalMilestones.sortOrder))
  return withProgress(goal, milestones, 0)
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
