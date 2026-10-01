import { useAssignments, useExams } from '@/features/study/hooks'
import { useLinkTargets } from '@/features/shared/useLinkTargets'
import { useTasks } from '@/features/tasks/hooks'
import { kindOf } from '@/lib/taskKinds'

/** Something pinned to a date: a deadline task, an exam or an assignment. */
export interface FixedItem {
  key: string
  date: string
  title: string
  detail?: string
  done: boolean
  taskId?: string
  href?: string
}

/** Every fixed date between `from` and `to` (inclusive, `YYYY-MM-DD`), oldest first. */
export function useFixedItems(from: string, to: string): FixedItem[] {
  const { data: tasks = [] } = useTasks({ includeDone: true })
  const { data: exams = [] } = useExams()
  const { data: assignments = [] } = useAssignments()
  const targets = useLinkTargets()
  const inRange = (d: string | null | undefined): d is string => !!d && d >= from && d <= to

  const items: FixedItem[] = [
    ...tasks
      .filter((t) => kindOf(t.tags) === 'deadline' && inRange(t.dueDate))
      .map((t) => ({ key: t.id, date: t.dueDate!, title: t.title, done: t.status === 'done', taskId: t.id })),
    ...exams
      .filter((e) => inRange(e.date))
      .map((e) => ({
        key: e.id,
        date: e.date,
        title: `${targets.nameOf('subjects', e.subjectId) ?? ''} exam`.trim(),
        detail: e.title,
        done: e.status !== 'upcoming',
        href: `/study/exams/${e.id}`,
      })),
    ...assignments
      .filter((a) => inRange(a.dueDate))
      .map((a) => ({
        key: a.id,
        date: a.dueDate!,
        title: a.title,
        detail: targets.nameOf('subjects', a.subjectId) ?? undefined,
        done: !!a.done,
        href: '/study',
      })),
  ]
  return items.sort((a, b) => a.date.localeCompare(b.date))
}

/** Open (not done) tasks of one kind, e.g. every open thread. */
export function useTasksOfKind(kind: 'thread' | 'pending') {
  const { data: tasks = [] } = useTasks({ view: 'all' })
  return tasks.filter((t) => kindOf(t.tags) === kind)
}
