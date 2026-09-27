import * as repo from '@/db/repositories/goals'
import { useDbMutation, useDbQuery } from '@/hooks/data'

export const useGoals = () => useDbQuery(['goals'], repo.listGoals)
export const useGoal = (id: string) => useDbQuery(['goal', id], () => repo.getGoal(id))

export function useGoalActions() {
  return {
    create: useDbMutation(repo.createGoal),
    update: useDbMutation(({ id, patch }: { id: string; patch: Parameters<typeof repo.updateGoal>[1] }) => repo.updateGoal(id, patch)),
    remove: useDbMutation(repo.deleteGoal),
    addMilestone: useDbMutation(({ goalId, title }: { goalId: string; title: string }) => repo.addMilestone(goalId, title)),
    toggleMilestone: useDbMutation(({ id, done }: { id: string; done: boolean }) => repo.setMilestoneDone(id, done)),
    removeMilestone: useDbMutation(repo.deleteMilestone),
  }
}
