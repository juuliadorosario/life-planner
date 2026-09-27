import { createTask, deleteTask, listTasks, setTaskDone, updateTask, type TaskFilter } from '@/db/repositories/tasks'
import { useDbMutation, useDbQuery } from '@/hooks/data'
import type { NewTask, Task } from '@/types/domain'

export function useTasks(filter: TaskFilter = {}) {
  return useDbQuery(['tasks', filter], () => listTasks(filter))
}

export function useTaskActions() {
  const toggle = useDbMutation(({ id, done }: { id: string; done: boolean }) => setTaskDone(id, done))
  const create = useDbMutation((input: Omit<NewTask, 'id'>) => createTask(input))
  const update = useDbMutation(({ id, patch }: { id: string; patch: Partial<Omit<Task, 'id'>> }) => updateTask(id, patch))
  const remove = useDbMutation((id: string) => deleteTask(id))
  return { toggle, create, update, remove }
}
