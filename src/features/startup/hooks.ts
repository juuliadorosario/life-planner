import * as repo from '@/db/repositories/startup'
import { useDbMutation, useDbQuery } from '@/hooks/data'

export const useMetrics = () => useDbQuery(['metrics'], repo.listMetrics)
export const useLinks = (filter: Parameters<typeof repo.listLinks>[0] = {}) => useDbQuery(['links', filter], () => repo.listLinks(filter))

export function useStartupActions() {
  return {
    upsertMetric: useDbMutation(({ month, values }: { month: string; values: Parameters<typeof repo.upsertMetric>[1] }) => repo.upsertMetric(month, values)),
    createLink: useDbMutation(repo.createLink),
    updateLink: useDbMutation(({ id, patch }: { id: string; patch: Parameters<typeof repo.updateLink>[1] }) => repo.updateLink(id, patch)),
    deleteLink: useDbMutation(repo.deleteLink),
  }
}
