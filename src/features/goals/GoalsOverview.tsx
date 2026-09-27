import { Link } from 'react-router'
import { addDays, differenceInCalendarDays, format, parseISO, startOfMonth, addMonths } from 'date-fns'
import { AlertTriangle, CheckCircle2, CircleDot, TrendingUp } from 'lucide-react'
import { Card, CardHeader } from '@/components/common/Card'
import { areaCategory, CATEGORY_BG } from '@/components/common/CategoryDot'
import type { GoalWithProgress } from '@/db/repositories/goals'
import { daysUntil } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { useLinkTargets } from '@/features/shared/useLinkTargets'
import { goalPace, PACE_LABEL } from './goalPace'

const PACE_ICON = { done: CheckCircle2, ahead: TrendingUp, 'on-track': CircleDot, behind: AlertTriangle }

export function PaceBadge({ goal }: { goal: GoalWithProgress }) {
  const pace = goalPace(goal)
  if (!pace) return null
  const Icon = PACE_ICON[pace.status]
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11.5px]', pace.status === 'behind' ? 'text-destructive' : pace.status === 'on-track' ? 'text-muted-foreground' : 'text-primary')}>
      <Icon className="size-3" strokeWidth={2} />
      {PACE_LABEL[pace.status]}
    </span>
  )
}

/** Summary numbers, a progress-vs-time chart, and a timeline of deadlines. */
export function GoalsOverview({ goals }: { goals: GoalWithProgress[] }) {
  const { areas } = useLinkTargets()
  const active = goals.filter((g) => g.status === 'active')
  const avg = active.length ? Math.round(active.reduce((a, g) => a + g.computedProgress, 0) / active.length) : 0
  const milestones = active.flatMap((g) => g.milestones)
  const withDeadline = active.filter((g) => g.deadline).sort((a, b) => a.deadline!.localeCompare(b.deadline!))
  const next = withDeadline.find((g) => daysUntil(g.deadline!) >= 0)
  const behind = active.filter((g) => goalPace(g)?.status === 'behind').length
  const slug = (g: GoalWithProgress) => areas.find((a) => a.id === g.areaId)?.slug

  // Timeline spans today → the furthest deadline.
  const now = new Date()
  const last = withDeadline.length ? parseISO(withDeadline.at(-1)!.deadline!) : addDays(now, 90)
  const span = Math.max(30, differenceInCalendarDays(last, now) + 10)
  const pos = (d: Date) => Math.min(100, Math.max(0, (differenceInCalendarDays(d, now) / span) * 100))
  const monthTicks: Date[] = []
  for (let m = addMonths(startOfMonth(now), 1); differenceInCalendarDays(m, now) < span; m = addMonths(m, 1)) monthTicks.push(m)

  return (
    <div className="mb-8 flex flex-col gap-5">
      <Card className="grid grid-cols-2 divide-border md:grid-cols-4 md:divide-x">
        {[
          { label: 'Active goals', value: String(active.length) },
          { label: 'Average progress', value: `${avg}%` },
          { label: 'Milestones', value: `${milestones.filter((m) => m.done).length}/${milestones.length}` },
          { label: 'Next deadline', value: next ? `${daysUntil(next.deadline!)}d` : '—', sub: next?.title },
        ].map((s) => (
          <div key={s.label} className="p-5">
            <div className="label-caps">{s.label}</div>
            <div className="figure mt-2 text-[28px] leading-none tabular">{s.value}</div>
            {s.sub && <div className="mt-1.5 truncate text-[12px] text-muted-foreground">{s.sub}</div>}
          </div>
        ))}
      </Card>

      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 p-6 lg:col-span-7">
          <CardHeader
            title="Progress vs time"
            action={behind > 0 ? <span className="text-[12px] text-destructive">{behind} behind</span> : <span className="text-[12px] text-muted-foreground">all on track</span>}
          />
          <div className="mt-5 flex flex-col gap-5">
            {active.map((g) => {
              const pace = goalPace(g)
              return (
                <Link key={g.id} to={`/goals/${g.id}`} className="group/g block" title={pace ? `${g.computedProgress}% done · ${Math.round(pace.elapsed)}% of the time used` : `${g.computedProgress}% done`}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="truncate text-[13.5px] group-hover/g:text-primary">{g.title}</span>
                    <span className="flex shrink-0 items-center gap-3">
                      <PaceBadge goal={g} />
                      <span className="text-[13px] font-medium tabular">{g.computedProgress}%</span>
                    </span>
                  </div>
                  <div className="relative h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out-soft" style={{ width: `${g.computedProgress}%` }} />
                    {pace && pace.elapsed > 2 && (
                      <div className="absolute -top-1 h-4 w-[2px] rounded-full bg-foreground/70" style={{ left: `calc(${pace.elapsed}% - 1px)` }} aria-hidden />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="mt-5 flex gap-4 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-full bg-primary" /> Progress</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-[2px] rounded-full bg-foreground/70" /> Time used</span>
          </div>
        </Card>

        <Card className="col-span-12 p-6 lg:col-span-5">
          <CardHeader title="Deadlines" />
          <div className="relative mt-6" style={{ height: withDeadline.length * 40 + 30 }}>
            {/* month gridlines */}
            {monthTicks.map((m) => (
              <div key={m.toISOString()} className="absolute top-0 bottom-6 border-l border-border/70" style={{ left: `${pos(m)}%` }}>
                <span className="absolute -bottom-6 -translate-x-1/2 text-[10.5px] text-faint">{format(m, 'MMM')}</span>
              </div>
            ))}
            <div className="absolute top-0 bottom-6 left-0 border-l-2 border-primary/60">
              <span className="absolute -bottom-6 text-[10.5px] font-medium text-primary">Today</span>
            </div>
            {withDeadline.map((g, i) => {
              const at = pos(parseISO(g.deadline!))
              const right = at > 60
              return (
                <Link key={g.id} to={`/goals/${g.id}`} className="group/d absolute flex items-center" style={{ top: i * 40 + 6, left: `${at}%`, transform: 'translateX(-50%)' }} title={`${g.title} · ${format(parseISO(g.deadline!), 'MMM d, yyyy')}`}>
                  <span className={cn('size-3 shrink-0 rounded-full ring-4 ring-card', CATEGORY_BG[areaCategory(slug(g))])} />
                  <span className={cn('absolute top-1/2 -translate-y-1/2 text-[12px] whitespace-nowrap group-hover/d:text-primary', right ? 'right-5 text-right' : 'left-5')}>
                    <span className="text-foreground">{g.title}</span>
                    <span className="ml-1.5 text-muted-foreground tabular">{daysUntil(g.deadline!)}d</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
