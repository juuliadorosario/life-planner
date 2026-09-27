import { Link, useNavigate, useParams } from 'react-router'
import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { Panel } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { Page, PageHeader } from '@/components/common/PageHeader'
import { ProgressRing } from '@/components/common/Progress'
import { Button } from '@/components/ui/button'
import { PhotoSlot } from '@/features/photos/PhotoSlot'
import { defaultCover, PROJECT_COVERS } from '@/features/photos/builtin'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTransactions } from '@/features/finance/hooks'
import { BackLink, Fact } from '@/features/shared/DetailBits'
import { LinksPanel } from '@/features/shared/LinksPanel'
import { NotesList } from '@/features/shared/NotesList'
import { useLinkTargets } from '@/features/shared/useLinkTargets'
import { useTasks } from '@/features/tasks/hooks'
import { TaskRow } from '@/features/tasks/TaskRow'
import { InlineAddTask } from '@/features/tasks/TasksPage'
import { useMoney } from '@/hooks/useSettings'
import { daysUntil, parseDay } from '@/lib/dates'
import type { Project } from '@/types/domain'
import { useProject, useProjectActions, useProjects } from './hooks'

export function ProjectPage() {
  const { id = '' } = useParams()
  const { data: project, isLoading } = useProject(id)
  const { data: allProjects = [] } = useProjects()
  const { data: tasks = [] } = useTasks({ projectId: id, includeDone: true })
  const { data: tx = [] } = useTransactions({ scope: 'startup' })
  const targets = useLinkTargets()
  const { update, remove } = useProjectActions()
  const navigate = useNavigate()
  const money = useMoney()

  if (isLoading) return null
  if (!project) return <Page><EmptyState title="Project not found." /></Page>

  const done = tasks.filter((t) => t.status === 'done').length
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0
  const area = targets.areas.find((a) => a.id === project.areaId)
  const goal = targets.goals.find((g) => g.id === project.goalId)
  const spend = tx.filter((t) => t.projectId === id)

  return (
    <Page wide>
      <BackLink to="/projects">Projects</BackLink>
      <PhotoSlot slot={`cover.project.${id}`} fallback={defaultCover(allProjects.findIndex((x) => x.id === id), PROJECT_COVERS)} className="mb-8 h-[180px] w-full" rounded="rounded-xl" placeholder="Add a cover photo" />
      <PageHeader
        eyebrow={area?.name ?? 'Project'}
        title={project.name}
        description={project.description}
        actions={
          <>
            <Select value={project.status} onValueChange={(v) => update.mutate({ id, patch: { status: v as Project['status'] } })}>
              <SelectTrigger size="sm" className="w-28 capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['active', 'paused', 'done'].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon-sm" onClick={() => remove.mutate(id, { onSuccess: () => navigate('/projects') })} aria-label="Delete project">
              <Trash2 />
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 flex flex-col gap-5 lg:col-span-8">
          <Panel title="Tasks" action={<span className="text-[12px] text-muted-foreground tabular">{done}/{tasks.length} done</span>}>
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} showContext={false} />
            ))}
            <InlineAddTask defaults={{ projectId: id, areaId: project.areaId, goalId: project.goalId }} placeholder="Add a task to this project" />
          </Panel>
          <NotesList filter={{ projectId: id }} defaults={{ projectId: id, areaId: project.areaId, goalId: project.goalId, folder: area?.name ?? null }} />
        </div>
        <div className="col-span-12 flex flex-col gap-5 lg:col-span-4">
          <Panel title="Overview">
            <div className="mb-3 flex items-center gap-4">
              <ProgressRing value={progress} size={56}>
                <span className="text-[13px] font-semibold tabular">{progress}%</span>
              </ProgressRing>
              <div className="text-[13px] text-muted-foreground">
                {tasks.length - done} open {tasks.length - done === 1 ? 'task' : 'tasks'}
              </div>
            </div>
            <div className="divide-y divide-border">
              <Fact label="Deadline">
                {project.deadline ? (
                  <>
                    {format(parseDay(project.deadline), 'MMM d, yyyy')}
                    <span className="ml-1.5 text-muted-foreground">({daysUntil(project.deadline)}d)</span>
                  </>
                ) : (
                  '—'
                )}
              </Fact>
              <Fact label="Goal">{goal ? <Link to={`/goals/${goal.id}`} className="hover:text-primary">{goal.name}</Link> : '—'}</Fact>
              <Fact label="Area">{area?.name ?? '—'}</Fact>
              {spend.length > 0 && <Fact label="Spent">{money(spend.reduce((a, t) => a + t.amount, 0))}</Fact>}
            </div>
          </Panel>
          <LinksPanel title="Resources" filter={{ projectId: id }} />
        </div>
      </div>
    </Page>
  )
}
