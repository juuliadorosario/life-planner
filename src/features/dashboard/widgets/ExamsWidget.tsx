import { Link } from 'react-router'
import { format } from 'date-fns'
import { GraduationCap } from 'lucide-react'
import { Panel } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { useExams } from '@/features/study/hooks'
import { daysUntil, parseDay } from '@/lib/dates'
import { cn } from '@/lib/utils'

export function ExamsWidget() {
  const { data: exams = [] } = useExams({ upcomingOnly: true })
  return (
    <Panel title="Upcoming exams" href="/study">
      {exams.length ? (
        <div className="flex flex-col gap-1">
          {exams.slice(0, 4).map((e) => {
            const days = daysUntil(e.date)
            return (
              <Link key={e.id} to={`/study/exams/${e.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/70">
                <div className="grid w-10 shrink-0 text-center leading-none">
                  <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">{format(parseDay(e.date), 'MMM')}</span>
                  <span className="mt-1 text-[17px] figure tabular">{format(parseDay(e.date), 'd')}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px]">{e.title}</div>
                  <div className={cn('text-[12px]', days <= 7 ? 'text-destructive/90' : 'text-muted-foreground')}>
                    {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days} days`}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyState compact icon={GraduationCap} title="No exams coming up." />
      )}
    </Panel>
  )
}
