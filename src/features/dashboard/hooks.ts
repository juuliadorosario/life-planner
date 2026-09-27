import * as repo from '@/db/repositories/dashboard'
import { useDbMutation, useDbQuery } from '@/hooks/data'
import type { DashboardWidget } from '@/types/domain'

export const useWidgets = () => useDbQuery(['widgets'], repo.listWidgets)

export function useWidgetActions() {
  return {
    update: useDbMutation(({ id, patch }: { id: string; patch: Partial<Omit<DashboardWidget, 'id'>> }) => repo.updateWidget(id, patch)),
    reorder: useDbMutation(repo.reorderWidgets),
    add: useDbMutation(({ type, size }: { type: string; size: DashboardWidget['size'] }) => repo.addWidget(type, size)),
    reset: useDbMutation(repo.resetWidgets),
  }
}
