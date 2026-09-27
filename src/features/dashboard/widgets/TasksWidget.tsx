import { Sun } from 'lucide-react'
import { Panel } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { useTasks } from '@/features/tasks/hooks'
import { TaskRow } from '@/features/tasks/TaskRow'
import { InlineAddTask } from '@/features/tasks/TasksPage'
import { today } from '@/lib/dates'

export function TasksWidget() {
  const { data: tasks = [] } = useTasks({ view: 'today' })
  const open = tasks.filter((t) => t.status !== 'done')
  const shown = [...open, ...tasks.filter((t) => t.status === 'done')].slice(0, 7)
  return (
    <Panel
      title="Tasks"
      href="/tasks"
      action={<span className="text-[12px] text-muted-foreground tabular">{open.length} open</span>}
    >
      {shown.length ? (
        shown.map((t) => <TaskRow key={t.id} task={t} dense />)
      ) : (
        <EmptyState compact icon={Sun} title="You're all caught up." />
      )}
      <InlineAddTask defaults={{ dueDate: today() }} />
    </Panel>
  )
}
