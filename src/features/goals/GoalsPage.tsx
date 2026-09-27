import { Link } from 'react-router'
import { format } from 'date-fns'
import { Plus, Target } from 'lucide-react'
import { useUI } from '@/app/ui-state'
import { Card } from '@/components/common/Card'
import { areaCategory, CategoryDot } from '@/components/common/CategoryDot'
import { EmptyState } from '@/components/common/EmptyState'
import { Page, PageHeader } from '@/components/common/PageHeader'
import { ProgressRing } from '@/components/common/Progress'
import { Button } from '@/components/ui/button'
import { daysUntil, parseDay } from '@/lib/dates'
import { useLinkTargets } from '@/features/shared/useLinkTargets'
import { GoalsOverview, PaceBadge } from './GoalsOverview'
import { useGoals } from './hooks'

export function GoalsPage() {
  const { data: goals = [] } = useGoals()
  const { areas } = useLinkTargets()
  const { openDialog } = useUI()
  return (
    <Page banner="goals" bannerCount={4}>
      <PageHeader eyebrow="Goals" title="Where you're heading" actions={<Button onClick={() => openDialog('goal')}><Plus /> New goal</Button>} />
      {goals.length > 0 && <GoalsOverview goals={goals} />}
      {goals.length ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {goals.map((g) => {
            const area = areas.find((a) => a.id === g.areaId)
            return (
              <Link key={g.id} to={`/goals/${g.id}`} className="group/g">
                <Card className="flex h-full items-start gap-5 p-6 transition-[border-color,transform] duration-200 group-hover/g:-translate-y-0.5 group-hover/g:border-border-strong">
                  <ProgressRing value={g.computedProgress} size={64} stroke={4}>
                    <span className="text-[14px] font-semibold tabular">{g.computedProgress}%</span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <CategoryDot category={areaCategory(area?.slug)} /> {area?.name ?? 'Personal'}
                      <span className="ml-auto"><PaceBadge goal={g} /></span>
                    </div>
                    <h3 className="display text-title-soft mt-1.5 text-[21px] leading-tight">{g.title}</h3>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{g.description}</p>
                    <div className="mt-3 flex gap-4 text-[12px] text-muted-foreground tabular">
                      {g.milestones.length > 0 && <span>{g.milestones.filter((m) => m.done).length}/{g.milestones.length} milestones</span>}
                      {g.openTasks > 0 && <span>{g.openTasks} open tasks</span>}
                      {g.deadline && <span>{format(parseDay(g.deadline), 'MMM d')} · {daysUntil(g.deadline)}d left</span>}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card><EmptyState icon={Target} title="No goals yet." description="Goals give your tasks and projects a direction." action={<Button variant="outline" size="sm" onClick={() => openDialog('goal')}><Plus /> Create goal</Button>} /></Card>
      )}
    </Page>
  )
}
