import { Link } from 'react-router'
import { Target } from 'lucide-react'
import { Panel } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { ProgressBar } from '@/components/common/Progress'
import { useGoals } from '@/features/goals/hooks'

export function GoalsWidget() {
  const { data: goals = [] } = useGoals()
  const active = goals.filter((g) => g.status === 'active').slice(0, 4)
  return (
    <Panel title="Goals" href="/goals">
      {active.length ? (
        <div className="flex flex-col gap-4">
          {active.map((g) => (
            <Link key={g.id} to={`/goals/${g.id}`} className="group/goal block">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="truncate text-[13.5px] group-hover/goal:text-primary">{g.title}</span>
                <span className="text-[12.5px] font-medium tabular text-muted-foreground">{g.computedProgress}%</span>
              </div>
              <ProgressBar value={g.computedProgress} />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState compact icon={Target} title="No goals yet." />
      )}
    </Panel>
  )
}
