import { useState } from 'react'
import { CalendarClock, Flag } from 'lucide-react'
import { useUI } from '@/app/ui-state'
import { CheckCircle } from '@/components/common/CheckCircle'
import { daysUntil, relativeDay } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/domain'
import { useLinkTargets } from '@/features/shared/useLinkTargets'
import { useTaskActions } from './hooks'

export function TaskRow({ task, showDue = true, showContext = true, dense }: { task: Task; showDue?: boolean; showContext?: boolean; dense?: boolean }) {
  const { toggle } = useTaskActions()
  const { openTask } = useUI()
  const targets = useLinkTargets()
  // Local state so the check + strike-through happen instantly.
  const [optimistic, setOptimistic] = useState<boolean | null>(null)
  const done = optimistic ?? task.status === 'done'
  const context =
    targets.nameOf('subjects', task.subjectId) ?? targets.nameOf('projects', task.projectId) ?? targets.nameOf('goals', task.goalId)
  const overdue = !done && task.dueDate && daysUntil(task.dueDate) < 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openTask(task.id)}
      onKeyDown={(e) => e.key === 'Enter' && openTask(task.id)}
      className={cn(
        'group/task -mx-2 flex items-start gap-3 rounded-lg px-2 transition-colors hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:outline-none',
        dense ? 'py-1.5' : 'py-2',
      )}
    >
      <CheckCircle
        checked={done}
        className="mt-[1px]"
        onChange={(v) => {
          setOptimistic(v)
          toggle.mutate({ id: task.id, done: v }, { onSettled: () => setOptimistic(null) })
        }}
      />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'truncate text-[13.5px] leading-5 transition-colors duration-300',
            done ? 'text-muted-foreground line-through decoration-faint' : 'text-foreground',
          )}
        >
          {task.title}
        </div>
        {!dense && (showContext || showDue) && (context || task.dueDate) && (
          <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted-foreground">
            {showDue && task.dueDate && (
              <span className={cn('flex items-center gap-1', overdue && 'text-destructive')}>
                <CalendarClock className="size-3" strokeWidth={1.75} />
                {relativeDay(task.dueDate)}
              </span>
            )}
            {showContext && context && <span className="truncate">{context}</span>}
          </div>
        )}
      </div>
      {task.priority >= 2 && !done && (
        <Flag
          className={cn('mt-[3px] size-3.5 shrink-0', task.priority === 3 ? 'text-destructive/80' : 'text-faint')}
          strokeWidth={1.75}
          aria-label={task.priority === 3 ? 'High priority' : 'Medium priority'}
        />
      )}
    </div>
  )
}
