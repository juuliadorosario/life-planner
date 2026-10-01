import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { format } from 'date-fns'
import { Plus, Trash2, X } from 'lucide-react'
import { Panel } from '@/components/common/Card'
import { CheckCircle } from '@/components/common/CheckCircle'
import { EmptyState } from '@/components/common/EmptyState'
import { Page, PageHeader } from '@/components/common/PageHeader'
import { ProgressRing } from '@/components/common/Progress'
import { Button } from '@/components/ui/button'
import { useProjects } from '@/features/projects/hooks'
import { BackLink, Fact } from '@/features/shared/DetailBits'
import { NotesList } from '@/features/shared/NotesList'
import { useLinkTargets } from '@/features/shared/useLinkTargets'
import { useHabits } from '@/features/health/hooks'
import { useTasks } from '@/features/tasks/hooks'
import { TaskRow } from '@/features/tasks/TaskRow'
import { InlineAddTask } from '@/features/tasks/TasksPage'
import { daysUntil, parseDay } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { useGoal, useGoalActions } from './hooks'

export function GoalPage() {
  const { id = '' } = useParams()
  const { data: goal, isLoading } = useGoal(id)
  const { data: tasks = [] } = useTasks({ goalId: id, includeDone: true })
  const { data: projects = [] } = useProjects()
  const { data: habits = [] } = useHabits()
  const { areas } = useLinkTargets()
  const actions = useGoalActions()
  const navigate = useNavigate()
  const [milestone, setMilestone] = useState('')

  if (isLoading) return null
  if (!goal) return <Page><EmptyState title="Goal not found." /></Page>
  const area = areas.find((a) => a.id === goal.areaId)
  const linkedProjects = projects.filter((p) => p.goalId === id)
  const linkedHabits = habits.filter((h) => h.goalId === id)

  return (
    <Page wide>
      <BackLink to="/goals">Goals</BackLink>
      <PageHeader
        eyebrow={area?.name ?? 'Goal'}
        title={goal.title}
        description={goal.description}
        actions={
          <Button variant="ghost" size="icon-sm" onClick={() => actions.remove.mutate(id, { onSuccess: () => navigate('/goals') })} aria-label="Delete goal">
            <Trash2 />
          </Button>
        }
      />
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 flex flex-col gap-5 lg:col-span-8">
          <Panel title="Milestones" action={<span className="text-[12px] text-muted-foreground tabular">{goal.milestones.filter((m) => m.done).length}/{goal.milestones.length}</span>}>
            {goal.milestones.length === 0 && (
              <p className="mb-2 text-[13px] text-muted-foreground">Break the goal into steps. Each one you tick off moves the progress ring.</p>
            )}
            <div className="flex flex-col">
              {goal.milestones.map((m) => (
                <div key={m.id} className="group/m -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60">
                  <CheckCircle checked={m.done} onChange={(done) => actions.toggleMilestone.mutate({ id: m.id, done })} />
                  <span className={cn('flex-1 text-[14px]', m.done && 'text-muted-foreground line-through decoration-faint')}>{m.title}</span>
                  <button onClick={() => actions.removeMilestone.mutate(m.id)} className="opacity-0 transition-opacity group-hover/m:opacity-100" aria-label="Remove milestone">
                    <X className="size-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
            <form
              className="-mx-2 flex items-center gap-3 px-2 py-2 text-muted-foreground"
              onSubmit={(e) => {
                e.preventDefault()
                if (!milestone.trim()) return
                actions.addMilestone.mutate({ goalId: id, title: milestone.trim() })
                setMilestone('')
              }}
            >
              <Plus className="size-[18px] p-0.5" />
              <input value={milestone} onChange={(e) => setMilestone(e.target.value)} placeholder="Add a milestone and press Enter" className="flex-1 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground" />
            </form>
            {goal.milestones.length === 0 && (
              <div className="mt-2 flex items-center gap-3 border-t border-border pt-4 text-[13px] text-muted-foreground">
                Manual progress
                <input type="range" min={0} max={100} step={5} defaultValue={goal.progress} onMouseUp={(e) => actions.update.mutate({ id, patch: { progress: Number(e.currentTarget.value) } })} className="flex-1 accent-[var(--primary)]" />
              </div>
            )}
          </Panel>
          <Panel title="Tasks">
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
            <InlineAddTask defaults={{ goalId: id, areaId: goal.areaId }} placeholder="Add a task toward this goal" />
          </Panel>
          <NotesList filter={{ goalId: id }} defaults={{ goalId: id, areaId: goal.areaId }} />
        </div>
        <div className="col-span-12 flex flex-col gap-5 lg:col-span-4">
          <Panel title="Progress">
            <div className="flex flex-col items-center py-4">
              <ProgressRing value={goal.computedProgress} size={120} stroke={6}>
                <div className="text-center">
                  <div className="text-[26px] figure tabular">{goal.computedProgress}%</div>
                </div>
              </ProgressRing>
            </div>
            <div className="divide-y divide-border">
              <Fact label="Deadline">{goal.deadline ? `${format(parseDay(goal.deadline), 'MMM d, yyyy')} · ${daysUntil(goal.deadline)}d` : '—'}</Fact>
              <Fact label="Milestones">{goal.milestones.filter((m) => m.done).length}/{goal.milestones.length}</Fact>
              <Fact label="Open tasks">{tasks.filter((t) => t.status !== 'done').length}</Fact>
            </div>
          </Panel>
          {(linkedProjects.length > 0 || linkedHabits.length > 0) && (
            <Panel title="Connected">
              <div className="flex flex-col">
                {linkedProjects.map((p) => (
                  <Link key={p.id} to={`/projects/${p.id}`} className="-mx-2 flex justify-between rounded-lg px-2 py-2 text-[13px] hover:bg-muted/60">
                    <span>{p.name}</span>
                    <span className="text-muted-foreground tabular">{p.progress}%</span>
                  </Link>
                ))}
                {linkedHabits.map((h) => (
                  <Link key={h.id} to="/health" className="-mx-2 flex justify-between rounded-lg px-2 py-2 text-[13px] hover:bg-muted/60">
                    <span>{h.name}</span>
                    <span className="text-muted-foreground">Habit · {h.targetPerWeek}×/week</span>
                  </Link>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </Page>
  )
}
