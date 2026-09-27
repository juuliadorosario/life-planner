import { Link } from 'react-router'
import { Panel } from '@/components/common/Card'
import { ProgressBar } from '@/components/common/Progress'
import { useSubjects } from '@/features/study/hooks'

export function StudyWidget() {
  const { data: subjects = [] } = useSubjects()
  return (
    <Panel title="Study" href="/study">
      <div className="flex flex-col gap-3.5">
        {subjects.map((s) => (
          <Link key={s.id} to={`/study/subjects/${s.id}`} className="group/s block">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[13.5px] group-hover/s:text-primary">{s.name}</span>
              <span className="text-[12.5px] tabular text-muted-foreground">{s.progress}%</span>
            </div>
            <ProgressBar value={s.progress} />
          </Link>
        ))}
      </div>
    </Panel>
  )
}
