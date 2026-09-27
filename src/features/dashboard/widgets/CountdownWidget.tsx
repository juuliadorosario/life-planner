import { Link } from 'react-router'
import { format } from 'date-fns'
import { Card } from '@/components/common/Card'
import { useExams } from '@/features/study/hooks'
import { useSettings } from '@/hooks/useSettings'
import { daysUntil, parseDay } from '@/lib/dates'

/** Counts down to a custom date (Settings) or, by default, the next exam. */
export function CountdownWidget() {
  const { countdown } = useSettings()
  const { data: exams = [] } = useExams({ upcomingOnly: true })
  const target = countdown && daysUntil(countdown.date) >= 0 ? { title: countdown.title, date: countdown.date, href: '/settings' } : exams[0] ? { title: exams[0].title, date: exams[0].date, href: `/study/exams/${exams[0].id}` } : null
  return (
    <Card className="flex flex-col justify-between p-5">
      <span className="label-caps">Countdown</span>
      {target ? (
        <Link to={target.href} className="mt-4 block">
          <div className="flex items-baseline gap-2">
            <span className="text-[44px] leading-none figure tabular">{daysUntil(target.date)}</span>
            <span className="text-[14px] text-muted-foreground">days</span>
          </div>
          <div className="mt-3 truncate text-[13.5px]">{target.title}</div>
          <div className="text-[12px] text-muted-foreground">{format(parseDay(target.date), 'EEEE, MMMM d')}</div>
        </Link>
      ) : (
        <p className="mt-4 text-[13px] text-muted-foreground">Set a date in Settings.</p>
      )}
    </Card>
  )
}
