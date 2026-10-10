import type { ReactNode } from 'react'
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { endOfWeek, format, startOfWeek } from 'date-fns'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Panel } from '@/components/common/Card'
import { useTaskActions, useTasks } from '@/features/tasks/hooks'
import { TaskRow } from '@/features/tasks/TaskRow'
import { InlineAddTask } from '@/features/tasks/TasksPage'
import { useNow } from '@/hooks/useNow'
import { parseDay, toDay } from '@/lib/dates'
import { kindOf, withKind } from '@/lib/taskKinds'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/domain'
import { useFixedItems } from '../plan'
import { FixedRow } from './FixedRow'

const WEEK = { weekStartsOn: 1 } as const

type Column = 'fixed' | 'flexible'

/** A task row you can drag to the other column, or send there with the arrow that shows on hover. */
function Movable({ id, to, onMove, children }: { id: string; to: Column; onMove: () => void; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  const Arrow = to === 'fixed' ? ArrowLeft : ArrowRight
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      {...listeners}
      className={cn('group/move relative cursor-grab active:cursor-grabbing', isDragging && 'z-30 rounded-lg bg-card opacity-90 shadow-float')}
    >
      {children}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onMove()
        }}
        className="absolute top-1/2 right-0 grid size-6 -translate-y-1/2 place-items-center rounded-md bg-card text-muted-foreground opacity-0 shadow-card group-hover/move:opacity-100 hover:text-foreground"
        aria-label={to === 'fixed' ? 'Move to Fixed' : 'Move to Flexible'}
        title={to === 'fixed' ? 'Move to Fixed' : 'Move to Flexible'}
      >
        <Arrow className="size-3.5" strokeWidth={1.75} />
      </button>
    </div>
  )
}

function DropColumn({ id, label, children }: { id: Column; label: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <section ref={setNodeRef} className={cn('-m-2 rounded-xl p-2 transition-colors', isOver && 'bg-muted/70')}>
      <div className="mb-2 label-caps">{label}</div>
      {children}
    </section>
  )
}

/** Monday to Sunday: what can't move on the left, what can on the right (from today on). Drag tasks between them. */
export function WeekWidget() {
  const now = useNow()
  const from = toDay(startOfWeek(now, WEEK))
  const to = toDay(endOfWeek(now, WEEK))
  const todayKey = toDay(now)
  const fixed = useFixedItems(from, to)
  const { data: tasks = [] } = useTasks({ includeDone: true })
  const { update } = useTaskActions()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const flexible = tasks.filter((t) => t.dueDate && t.dueDate >= todayKey && t.dueDate <= to && !kindOf(t.tags))
  const byDay = new Map<string, Task[]>()
  for (const t of flexible) byDay.set(t.dueDate!, [...(byDay.get(t.dueDate!) ?? []), t])
  const days = [...byDay.keys()].sort()

  // Fixed = the "deadline" kind; flexible = no kind. Only tasks move, exams and assignments stay fixed.
  const move = (id: string, column: Column) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const kind = column === 'fixed' ? 'deadline' : null
    if (kindOf(task.tags) === kind) return
    update.mutate({ id, patch: { tags: withKind(task.tags, kind) } })
  }
  const onDragEnd = ({ active, over }: DragEndEvent) => over && move(String(active.id), over.id as Column)

  return (
    <Panel title="This week" action={<span className="text-[12px] text-muted-foreground">{format(parseDay(from), 'd MMM')} – {format(parseDay(to), 'd MMM')}</span>}>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid gap-6 md:grid-cols-2">
          <DropColumn id="fixed" label="Fixed">
            {fixed.length ? (
              fixed.map((i) =>
                i.taskId ? (
                  <Movable key={i.key} id={i.taskId} to="flexible" onMove={() => move(i.taskId!, 'flexible')}>
                    <FixedRow item={i} />
                  </Movable>
                ) : (
                  <FixedRow key={i.key} item={i} />
                ),
              )
            ) : (
              <p className="text-[13px] text-muted-foreground">No deadlines this week.</p>
            )}
            <InlineAddTask defaults={{ dueDate: todayKey, tags: ['deadline'] }} placeholder="Add a fixed task for today" />
          </DropColumn>
          <DropColumn id="flexible" label="Flexible">
            {days.length ? (
              days.map((d) => (
                <div key={d} className="mb-2">
                  <div className={cn('text-[11px] tracking-wider uppercase', d === todayKey ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                    {d === todayKey ? 'Today' : format(parseDay(d), 'EEEE d')}
                  </div>
                  {byDay.get(d)!.map((t) => (
                    <Movable key={t.id} id={t.id} to="fixed" onMove={() => move(t.id, 'fixed')}>
                      <TaskRow task={t} dense />
                    </Movable>
                  ))}
                </div>
              ))
            ) : (
              <p className="text-[13px] text-muted-foreground">Nothing else planned.</p>
            )}
            <InlineAddTask defaults={{ dueDate: todayKey }} placeholder="Add a flexible task for today" />
          </DropColumn>
        </div>
      </DndContext>
    </Panel>
  )
}
