import { useState } from 'react'
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { CalendarClock, Columns3, Flag, List, Plus } from 'lucide-react'
import { useUI } from '@/app/ui-state'
import { Card, CardHeader } from '@/components/common/Card'
import { ProgressBar } from '@/components/common/Progress'
import { useProjects } from '@/features/projects/hooks'
import { useTaskActions, useTasks } from '@/features/tasks/hooks'
import { TaskRow } from '@/features/tasks/TaskRow'
import { InlineAddTask } from '@/features/tasks/TasksPage'
import { dayOffset, daysUntil, relativeDay, today } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/domain'

type Status = Task['status']

const COLUMNS: { id: Status; label: string; dot: string }[] = [
  { id: 'todo', label: 'To do', dot: 'bg-faint' },
  { id: 'doing', label: 'In progress', dot: 'bg-cat-school' },
  { id: 'done', label: 'Done', dot: 'bg-primary' },
]

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'bad' }) {
  return (
    <div className="p-5">
      <div className="label-caps">{label}</div>
      <div className={cn('figure mt-2 text-[28px] leading-none tabular', tone === 'bad' && value > 0 && 'text-destructive')}>{value}</div>
    </div>
  )
}

function TaskCard({ task, projectName }: { task: Task; projectName?: string }) {
  const { openTask } = useUI()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  const overdue = task.status !== 'done' && task.dueDate && daysUntil(task.dueDate) < 0
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      {...listeners}
      onClick={() => openTask(task.id)}
      className={cn(
        'group/card cursor-grab rounded-lg border border-border bg-card p-3 shadow-card transition-[box-shadow,opacity] active:cursor-grabbing',
        isDragging && 'z-30 opacity-90 shadow-float',
      )}
    >
      <div className={cn('text-[13.5px] leading-snug', task.status === 'done' && 'text-muted-foreground line-through decoration-faint')}>{task.title}</div>
      <div className="mt-2.5 flex items-center gap-2 text-[11.5px] text-muted-foreground">
        {projectName && <span className="truncate rounded-md bg-muted px-1.5 py-0.5">{projectName}</span>}
        {task.dueDate && task.status !== 'done' && (
          <span className={cn('flex shrink-0 items-center gap-1', overdue && 'text-destructive')}>
            <CalendarClock className="size-3" strokeWidth={1.75} />
            {relativeDay(task.dueDate)}
          </span>
        )}
        {task.priority >= 2 && task.status !== 'done' && (
          <Flag className={cn('ml-auto size-3 shrink-0', task.priority === 3 ? 'text-destructive/80' : 'text-faint')} strokeWidth={1.75} />
        )}
      </div>
    </div>
  )
}

function Column({ status, label, dot, tasks, projectName, areaId }: { status: Status; label: string; dot: string; tasks: Task[]; projectName: (id: string | null) => string | undefined; areaId?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const [adding, setAdding] = useState(false)
  return (
    <div ref={setNodeRef} className={cn('flex min-h-[320px] flex-col rounded-xl bg-muted/50 p-2.5 transition-colors', isOver && 'bg-primary-soft')}>
      <div className="flex items-center justify-between px-1.5 pt-1 pb-3">
        <span className="flex items-center gap-2 text-[13px] font-medium">
          <span className={cn('size-2 rounded-full', dot)} />
          {label}
          <span className="font-normal text-muted-foreground tabular">{tasks.length}</span>
        </span>
        {status !== 'done' && (
          <button onClick={() => setAdding((a) => !a)} className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground" aria-label={`Add to ${label}`}>
            <Plus className="size-3.5" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {adding && (
          <div className="rounded-lg border border-border bg-card px-3">
            <InlineAddTask defaults={{ areaId, status }} placeholder="Task name, then ↵" />
          </div>
        )}
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} projectName={projectName(t.projectId)} />
        ))}
        {!tasks.length && !adding && <div className="rounded-lg border border-dashed border-border-strong/70 py-6 text-center text-[12px] text-faint">Drop tasks here</div>}
      </div>
    </div>
  )
}

/** Startup tasks as a board (drag between columns) or grouped by project. */
export function StartupTasks({ areaId }: { areaId?: string }) {
  const { data: all = [] } = useTasks({ areaId: areaId ?? '__none__', includeDone: true })
  const { data: projects = [] } = useProjects()
  const { update, toggle } = useTaskActions()
  const [view, setView] = useState<'board' | 'projects'>('board')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const recentCutoff = dayOffset(-14)
  // Done column only keeps the last two weeks, so it doesn't grow forever.
  const tasks = all.filter((t) => t.status !== 'done' || (t.completedAt ?? '') >= recentCutoff)
  const open = all.filter((t) => t.status !== 'done')
  const weekEnd = dayOffset(7)
  const stats = {
    open: open.length,
    week: open.filter((t) => t.dueDate && t.dueDate >= today() && t.dueDate <= weekEnd).length,
    overdue: open.filter((t) => t.dueDate && t.dueDate < today()).length,
    done: all.filter((t) => t.status === 'done' && (t.completedAt ?? '') >= dayOffset(-7)).length,
  }
  const projectName = (id: string | null) => projects.find((p) => p.id === id)?.name
  const startupProjects = projects.filter((p) => p.areaId === areaId)

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return
    const task = all.find((t) => t.id === active.id)
    const status = over.id as Status
    if (!task || task.status === status) return
    if (status === 'done') toggle.mutate({ id: task.id, done: true })
    else update.mutate({ id: task.id, patch: { status, completedAt: null } })
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="grid grid-cols-2 divide-border md:grid-cols-4 md:divide-x">
        <Stat label="Open" value={stats.open} />
        <Stat label="Due this week" value={stats.week} />
        <Stat label="Overdue" value={stats.overdue} tone="bad" />
        <Stat label="Done · 7 days" value={stats.done} />
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex rounded-lg bg-muted p-0.5">
          {([
            ['board', 'Board', Columns3],
            ['projects', 'By project', List],
          ] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setView(id)} className={cn('flex h-7 items-center gap-1.5 rounded-md px-3 text-[12.5px]', view === id ? 'bg-card font-medium shadow-card' : 'text-muted-foreground hover:text-foreground')}>
              <Icon className="size-3.5" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-faint">Drag cards between columns · click to edit</span>
      </div>

      {view === 'board' ? (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {COLUMNS.map((c) => (
              <Column key={c.id} status={c.id} label={c.label} dot={c.dot} tasks={tasks.filter((t) => t.status === c.id)} projectName={projectName} areaId={areaId} />
            ))}
          </div>
        </DndContext>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[...startupProjects.map((p) => ({ id: p.id as string | null, name: p.name })), { id: null, name: 'No project' }].map((group) => {
            const items = all.filter((t) => t.projectId === group.id)
            if (!items.length && group.id === null) return null
            const done = items.filter((t) => t.status === 'done').length
            return (
              <Card key={group.id ?? 'none'} className="p-5">
                <CardHeader title={group.name} href={group.id ? `/projects/${group.id}` : undefined} action={<span className="text-[12px] text-muted-foreground tabular">{done}/{items.length}</span>} />
                <ProgressBar value={items.length ? (done / items.length) * 100 : 0} className="mt-3 mb-2" />
                {items.filter((t) => t.status !== 'done').map((t) => (
                  <TaskRow key={t.id} task={t} showContext={false} />
                ))}
                <InlineAddTask defaults={{ areaId, projectId: group.id }} />
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
