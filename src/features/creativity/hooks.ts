import * as repo from '@/db/repositories/creative'
import { useDbMutation, useDbQuery } from '@/hooks/data'

export const useCreativeItems = () => useDbQuery(['creative-items'], repo.listCreativeItems)

export function useCreativeActions() {
  return {
    add: useDbMutation(repo.addCreativeItem),
    update: useDbMutation(({ id, patch }: { id: string; patch: Parameters<typeof repo.updateCreativeItem>[1] }) => repo.updateCreativeItem(id, patch)),
    remove: useDbMutation(repo.deleteCreativeItem),
    renameBoard: useDbMutation(({ from, to }: { from: string; to: string }) => repo.renameBoard(from, to)),
  }
}
