import { useMemo } from 'react'
import { Link } from 'react-router'
import { Card } from '@/components/common/Card'
import { CheckCircle } from '@/components/common/CheckCircle'
import { useHabitLogs, useHabits, useHealthActions } from '@/features/health/hooks'
import { dayOffset, today } from '@/lib/dates'
import { cn } from '@/lib/utils'

export function HabitsWidget() {
  const { data: habits = [] } = useHabits()
  const from = dayOffset(-6)
  const { data: logs = [] } = useHabitLogs(from, today())
  const { toggleHabit } = useHealthActions()
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => dayOffset(i - 6)), [])
  const done = new Set(logs.map((l) => `${l.habitId}:${l.date}`))
  const doneToday = habits.filter((h) => done.has(`${h.id}:${today()}`)).length

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center justify-between">
        <Link to="/health" className="label-caps hover:text-foreground">Habits</Link>
        <span className="text-[12px] text-muted-foreground tabular">
          {doneToday}/{habits.length} today
        </span>
      </div>
      <div className="mt-3 flex flex-col">
        {habits.map((h) => (
          <div key={h.id} className="flex items-center gap-3 py-1.5">
            <CheckCircle size="sm" checked={done.has(`${h.id}:${today()}`)} onChange={() => toggleHabit.mutate({ habitId: h.id, date: today() })} label={h.name} />
            <span className="min-w-0 flex-1 truncate text-[13px]">{h.name}</span>
            <div className="flex gap-[3px]">
              {days.map((d) => (
                <span key={d} className={cn('size-[7px] rounded-full', done.has(`${h.id}:${d}`) ? 'bg-primary/80' : 'bg-muted')} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
