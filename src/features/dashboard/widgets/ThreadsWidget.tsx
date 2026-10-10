import { Panel } from '@/components/common/Card'
import { TaskRow } from '@/features/tasks/TaskRow'
import { InlineAddTask } from '@/features/tasks/TasksPage'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/utils'
import { useTasksOfKind } from '../plan'

/** Things with no date: threads waiting on someone, and facts still missing. Reviewed every Friday. */
export function ThreadsWidget() {
  const friday = useNow().getDay() === 5
  const threads = useTasksOfKind('thread')
  const pending = useTasksOfKind('pending')
  return (
    <Panel
      title="Open threads"
      href="/tasks"
      action={<span className={cn('text-[12px]', friday ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{friday ? 'Review today' : 'Review on Friday'}</span>}
    >
      {threads.length ? threads.map((t) => <TaskRow key={t.id} task={t} dense />) : <p className="text-[13px] text-muted-foreground">No open threads.</p>}
      <InlineAddTask defaults={{ tags: ['thread'] }} placeholder="Add an open thread" />
      <div className="mt-5 mb-1 label-caps">Pending info</div>
      {pending.length ? pending.map((t) => <TaskRow key={t.id} task={t} dense />) : <p className="text-[13px] text-muted-foreground">Nothing missing.</p>}
      <InlineAddTask defaults={{ tags: ['pending'] }} placeholder="Add pending info" />
    </Panel>
  )
}
