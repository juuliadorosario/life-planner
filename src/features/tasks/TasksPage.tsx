import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { CheckCheck, Inbox, Plus, Sun, CalendarRange } from 'lucide-react'
import { format } from 'date-fns'
import { useUI } from '@/app/ui-state'
import { Card } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { Kbd } from '@/components/common/Kbd'
import { Page, PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import type { TaskView } from '@/db/repositories/tasks'
import { daysUntil, parseDay, relativeDay, today } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/domain'
import { useTaskActions, useTasks } from './hooks'
import { TaskRow } from './TaskRow'

const VIEWS: { id: TaskView; label: string; icon: typeof Sun }[] = [
  { id: 'today', label: 'Today', icon: Sun },
  { id: 'upcoming', label: 'Upcoming', icon: CalendarRange },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'completed', label: 'Completed', icon: CheckCheck },
]

/** Inline "add a task" row — the fastest way in. */
export function InlineAddTask({ defaults = {}, placeholder = 'Add a task' }: { defaults?: Partial<Task>; placeholder?: string }) {
  const [title, setTitle] = useState('')
  const { create } = useTaskActions()
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        create.mutate({ title: title.trim(), ...defaults })
        setTitle('')
      }}
      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-muted-foreground focus-within:bg-muted/60"
    >
      <Plus className="size-[18px] p-0.5" strokeWidth={1.75} />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground"
      />
    </form>
  )
}

function groupByDay(tasks: Task[]) {
  const groups = new Map<string, Task[]>()
  for (const t of tasks) {
    const key = t.dueDate ?? 'none'
    groups.set(key, [...(groups.get(key) ?? []), t])
  }
  return [...groups.entries()]
}

export function TasksPage() {
  const [params, setParams] = useSearchParams()
  const view = (params.get('view') as TaskView) || 'today'
  const { data: tasks = [], isLoading } = useTasks({ view })
  const { openNewTask, openTask } = useUI()

  // Deep link from search: /tasks?task=<id>
  const deepLink = params.get('task')
  useEffect(() => {
    if (deepLink) {
      openTask(deepLink)
      params.delete('task')
      setParams(params, { replace: true })
    }
  }, [deepLink, openTask, params, setParams])

  const overdue = useMemo(() => tasks.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < today()), [tasks])
  const rest = useMemo(() => tasks.filter((t) => !overdue.includes(t)), [tasks, overdue])

  return (
    <Page>
      <PageHeader
        eyebrow="Tasks"
        title={VIEWS.find((v) => v.id === view)?.label}
        description={view === 'today' ? format(new Date(), 'EEEE, MMMM d') : undefined}
        actions={
          <Button onClick={() => openNewTask(view === 'today' ? { dueDate: today() } : {})}>
            <Plus /> New task <Kbd className="ml-1 border-primary-foreground/20 bg-transparent text-primary-foreground/70">N</Kbd>
          </Button>
        }
      />

      <div className="mb-6 flex gap-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setParams({ view: v.id })}
            className={cn(
              'flex h-8 items-center gap-2 rounded-lg px-3 text-[13px] transition-colors',
              view === v.id ? 'bg-card font-medium text-foreground shadow-card ring-1 ring-border' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <v.icon className={cn('size-3.5', view === v.id && 'text-primary')} strokeWidth={1.75} />
            {v.label}
          </button>
        ))}
      </div>

      <Card className="p-6">
        {isLoading ? null : tasks.length === 0 ? (
          <EmptyState
            icon={view === 'completed' ? CheckCheck : Sun}
            title={view === 'today' ? "You're all caught up." : view === 'inbox' ? 'Inbox zero.' : view === 'completed' ? 'Nothing completed yet.' : 'Nothing scheduled.'}
            description={view === 'inbox' ? 'Tasks without a date or project land here.' : undefined}
            action={
              view !== 'completed' && (
                <Button variant="outline" size="sm" onClick={() => openNewTask(view === 'today' ? { dueDate: today() } : {})}>
                  <Plus /> Create task
                </Button>
              )
            }
          />
        ) : view === 'upcoming' ? (
          <div className="flex flex-col gap-6">
            {groupByDay(tasks).map(([day, items]) => (
              <section key={day}>
                <h3 className="mb-1 flex items-baseline gap-2 text-[13px] font-medium">
                  {relativeDay(day)}
                  <span className="text-[12px] font-normal text-muted-foreground">
                    {daysUntil(day) < 7 ? format(parseDay(day), 'MMMM d') : format(parseDay(day), 'EEEE')}
                  </span>
                </h3>
                {items.map((t) => (
                  <TaskRow key={t.id} task={t} showDue={false} />
                ))}
              </section>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {overdue.length > 0 && view === 'today' && (
              <section>
                <h3 className="mb-1 text-[12px] font-medium text-destructive">Overdue</h3>
                {overdue.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </section>
            )}
            <section>
              {overdue.length > 0 && view === 'today' && <h3 className="mb-1 text-[12px] font-medium text-muted-foreground">Today</h3>}
              {(view === 'today' ? rest : tasks).map((t) => (
                <TaskRow key={t.id} task={t} showDue={view !== 'today'} />
              ))}
            </section>
          </div>
        )}
        {view !== 'completed' && tasks.length > 0 && (
          <div className="mt-2 border-t border-border pt-2">
            <InlineAddTask defaults={view === 'today' ? { dueDate: today() } : {}} />
          </div>
        )}
      </Card>
    </Page>
  )
}
