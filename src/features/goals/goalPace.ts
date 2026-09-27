import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { GoalWithProgress } from '@/db/repositories/goals'

/**
 * How far through its time a goal is (0–100), from creation to deadline, and
 * whether progress keeps up. `null` when the goal has no deadline or is less
 * than a week old (too early to say anything honest about pace).
 */
export function goalPace(goal: GoalWithProgress) {
  if (!goal.deadline) return null
  const start = parseISO(goal.createdAt)
  if (differenceInCalendarDays(new Date(), start) < 7 && goal.computedProgress < 100) return null
  const end = parseISO(goal.deadline)
  const total = Math.max(1, differenceInCalendarDays(end, start))
  const elapsed = Math.min(100, Math.max(0, (differenceInCalendarDays(new Date(), start) / total) * 100))
  const status: 'done' | 'ahead' | 'on-track' | 'behind' =
    goal.computedProgress >= 100 ? 'done' : goal.computedProgress >= elapsed + 10 ? 'ahead' : goal.computedProgress >= elapsed - 10 ? 'on-track' : 'behind'
  return { elapsed, status }
}

export const PACE_LABEL = { done: 'Achieved', ahead: 'Ahead', 'on-track': 'On track', behind: 'Behind' } as const
