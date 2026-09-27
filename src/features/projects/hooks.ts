import * as repo from '@/db/repositories/projects'
import { useDbMutation, useDbQuery } from '@/hooks/data'

export const useProjects = () => useDbQuery(['projects'], repo.listProjects)
export const useProject = (id: string) => useDbQuery(['project', id], () => repo.getProject(id))

export function useProjectActions() {
  return {
    create: useDbMutation(repo.createProject),
    update: useDbMutation(({ id, patch }: { id: string; patch: Parameters<typeof repo.updateProject>[1] }) => repo.updateProject(id, patch)),
    remove: useDbMutation(repo.deleteProject),
  }
}
