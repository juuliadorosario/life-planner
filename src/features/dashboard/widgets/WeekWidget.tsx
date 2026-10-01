import { endOfWeek, format, startOfWeek } from 'date-fns'
import { Panel } from '@/components/common/Card'
import { useTasks } from '@/features/tasks/hooks'
import { TaskRow } from '@/features/tasks/TaskRow'
import { useNow } from '@/hooks/useNow'
import { parseDay, toDay } from '@/lib/dates'
import { kindOf } from '@/lib/taskKinds'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/domain'
import { useFixedItems } from '../plan'
import { FixedRow } from './FixedRow'

const WEEK = { weekStartsOn: 1 } as const

/** Monday to Sunday: what can't move on the left, what can on the right (from today on). */
export function WeekWidget() {
  const now = useNow()
  const from = toDay(startOfWeek(now, WEEK))
  const to = toDay(endOfWeek(now, WEEK))
  const todayKey = toDay(now)
  const fixed = useFixedItems(from, to)
  const { data: tasks = [] } = useTasks({ includeDone: true })

  const flexible = tasks.filter((t) => t.dueDate && t.dueDate >= todayKey && t.dueDate <= to && !kindOf(t.tags))
  const byDay = new Map<string, Task[]>()
  for (const t of flexible) byDay.set(t.dueDate!, [...(byDay.get(t.dueDate!) ?? []), t])
  const days = [...byDay.keys()].sort()

  return (
    <Panel title="This week" action={<span className="text-[12px] text-muted-foreground">{format(parseDay(from), 'd MMM')} – {format(parseDay(to), 'd MMM')}</span>}>
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <div className="mb-2 label-caps">Fixed</div>
          {fixed.length ? fixed.map((i) => <FixedRow key={i.key} item={i} />) : <p className="text-[13px] text-muted-foreground">No deadlines this week.</p>}
        </section>
        <section>
          <div className="mb-2 label-caps">Flexible</div>
          {days.length ? (
            days.map((d) => (
              <div key={d} className="mb-2">
                <div className={cn('text-[11px] tracking-wider uppercase', d === todayKey ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                  {d === todayKey ? 'Today' : format(parseDay(d), 'EEEE d')}
                </div>
                {byDay.get(d)!.map((t) => (
                  <TaskRow key={t.id} task={t} dense />
                ))}
              </div>
            ))
          ) : (
            <p className="text-[13px] text-muted-foreground">Nothing else planned.</p>
          )}
        </section>
      </div>
    </Panel>
  )
}
