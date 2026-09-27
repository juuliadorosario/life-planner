import { Link } from 'react-router'
import { format, startOfWeek } from 'date-fns'
import { Dumbbell } from 'lucide-react'
import { Card, Panel } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { useSleep, useWorkouts } from '@/features/health/hooks'
import { parseDay, relativeDay, toDay } from '@/lib/dates'
import { cn } from '@/lib/utils'

export function WorkoutWidget() {
  const { data: workouts = [] } = useWorkouts(20)
  const weekStart = toDay(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const thisWeek = workouts.filter((w) => w.date >= weekStart).length
  const last = workouts[0]
  return (
    <Panel title="Workout" href="/health">
      <div className="flex items-end gap-2">
        <span className="text-[28px] leading-none figure tabular">{thisWeek}</span>
        <span className="pb-0.5 text-[13px] text-muted-foreground">of 4 this week</span>
      </div>
      <div className="mt-3 flex gap-1">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={cn('h-1 flex-1 rounded-full', i < thisWeek ? 'bg-primary' : 'bg-muted')} />
        ))}
      </div>
      {last ? (
        <Link to="/health" className="-mx-2 mt-4 flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/70">
          <div className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
            <Dumbbell className="size-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 text-[13px]">
            <div className="truncate">{last.title}</div>
            <div className="text-[12px] text-muted-foreground">
              {relativeDay(last.date)} · {last.durationMin} min
            </div>
          </div>
        </Link>
      ) : (
        <EmptyState compact title="No workouts logged." />
      )}
    </Panel>
  )
}

export function SleepWidget() {
  const { data: logs = [] } = useSleep(7)
  const nights = [...logs].reverse()
  const avg = nights.length ? nights.reduce((a, n) => a + n.hours, 0) / nights.length : 0
  return (
    <Card className="flex flex-col p-5">
      <Link to="/health" className="label-caps hover:text-foreground">Sleep</Link>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-[28px] leading-none figure tabular">{avg.toFixed(1)}</span>
        <span className="pb-0.5 text-[13px] text-muted-foreground">h average</span>
      </div>
      <div className="mt-4 flex h-16 items-end gap-1.5">
        {nights.map((n) => (
          <div key={n.date} className="flex flex-1 flex-col items-center gap-1">
            <div className={cn('w-full rounded-[4px]', n.hours >= 7.5 ? 'bg-primary/75' : 'bg-primary/30')} style={{ height: `${(n.hours / 10) * 100}%` }} title={`${n.hours} h`} />
            <span className="text-[10px] text-faint">{format(parseDay(n.date), 'EEEEE')}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
