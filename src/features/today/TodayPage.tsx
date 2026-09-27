import { useMemo } from 'react'
import { Link } from 'react-router'
import { endOfDay, format, startOfDay } from 'date-fns'
import { AlertCircle, CalendarDays, Plus, Sun } from 'lucide-react'
import { useUI } from '@/app/ui-state'
import { Card, Panel } from '@/components/common/Card'
import { CategoryDot } from '@/components/common/CategoryDot'
import { CheckCircle } from '@/components/common/CheckCircle'
import { EmptyState } from '@/components/common/EmptyState'
import { Page, PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { useCalendarEvents } from '@/features/calendar/hooks'
import { useHabitLogs, useHabits, useHealthActions } from '@/features/health/hooks'
import { useAssignments, useExams } from '@/features/study/hooks'
import { useTasks } from '@/features/tasks/hooks'
import { TaskRow } from '@/features/tasks/TaskRow'
import { InlineAddTask } from '@/features/tasks/TasksPage'
import { useNow } from '@/hooks/useNow'
import { dayOffset, daysUntil, relativeDay, today } from '@/lib/dates'
import { cn } from '@/lib/utils'

/** The day as a timeline with a "now" line running through it. */
function DayTimeline() {
  const now = useNow()
  const range = useMemo(() => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }), [])
  const { data: events = [] } = useCalendarEvents(range)
  const timed = events.filter((e) => !e.allDay)
  const allDay = events.filter((e) => e.allDay)
  const nowIndex = timed.findIndex((e) => e.start > now)

  if (!events.length) return <EmptyState icon={CalendarDays} title="Nothing scheduled." description="An open day. Use it well." />

  return (
    <div>
      {allDay.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {allDay.map((e) => (
            <span key={e.id} className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[12.5px]">
              <CategoryDot category={e.category} /> {e.title}
            </span>
          ))}
        </div>
      )}
      <ol className="relative">
        {timed.map((e, i) => {
          const current = e.start <= now && e.end > now
          const past = e.end <= now
          const body = (
            <div className={cn('flex gap-6 rounded-xl px-3 py-3 transition-colors', e.href && 'hover:bg-muted/60', current && 'bg-primary-soft/70')}>
              <div className="w-12 shrink-0 pt-0.5 text-right">
                <div className={cn('text-[14px] font-medium tabular', past && 'text-muted-foreground')}>{format(e.start, 'HH:mm')}</div>
                <div className="text-[11.5px] text-faint tabular">{format(e.end, 'HH:mm')}</div>
              </div>
              <div className="relative flex-1 border-l border-border pl-5">
                <span className={cn('absolute top-[7px] -left-[4.5px] size-2 rounded-full ring-4 ring-card', current ? 'bg-primary' : past ? 'bg-faint' : 'bg-border-strong')} />
                <div className={cn('text-[15px]', past ? 'text-muted-foreground' : 'text-foreground', current && 'font-medium')}>{e.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[12.5px] text-muted-foreground">
                  <CategoryDot category={e.category} />
                  <span className="capitalize">{e.category}</span>
                  {e.location && <span>· {e.location}</span>}
                  {current && <span className="font-medium text-primary">· Now</span>}
                </div>
              </div>
            </div>
          )
          return (
            <li key={e.id}>
              {i === nowIndex && !timed.some((t) => t.start <= now && t.end > now) && (
                <div className="my-1 flex items-center gap-3 pl-3">
                  <span className="w-12 text-right text-[11px] font-medium text-primary tabular">{format(now, 'HH:mm')}</span>
                  <span className="h-px flex-1 bg-primary/50" />
                </div>
              )}
              {e.href ? <Link to={e.href}>{body}</Link> : body}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function HabitsToday() {
  const { data: habits = [] } = useHabits()
  const { data: logs = [] } = useHabitLogs(today(), today())
  const { toggleHabit } = useHealthActions()
  const done = new Set(logs.map((l) => l.habitId))
  return (
    <Panel title="Habits" href="/health" action={<span className="text-[12px] text-muted-foreground tabular">{done.size}/{habits.length}</span>}>
      <div className="flex flex-col">
        {habits.map((h) => (
          <label key={h.id} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60">
            <CheckCircle checked={done.has(h.id)} onChange={() => toggleHabit.mutate({ habitId: h.id, date: today() })} label={h.name} />
            <span className={cn('text-[13.5px]', done.has(h.id) && 'text-muted-foreground')}>{h.name}</span>
          </label>
        ))}
      </div>
    </Panel>
  )
}

function Important() {
  const { data: exams = [] } = useExams({ upcomingOnly: true })
  const { data: assignments = [] } = useAssignments()
  const items = [
    ...exams.filter((e) => daysUntil(e.date) <= 14).map((e) => ({ id: e.id, title: e.title, date: e.date, href: `/study/exams/${e.id}`, kind: 'Exam' })),
    ...assignments.filter((a) => !a.done && a.dueDate && a.dueDate <= dayOffset(7)).map((a) => ({ id: a.id, title: a.title, date: a.dueDate!, href: `/study/subjects/${a.subjectId}`, kind: 'Due' })),
  ].sort((a, b) => a.date.localeCompare(b.date))
  return (
    <Panel title="Important">
      {items.length ? (
        <div className="flex flex-col">
          {items.map((i) => (
            <Link key={i.id} to={i.href} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60">
              <AlertCircle className={cn('size-4 shrink-0', i.kind === 'Exam' ? 'text-destructive/80' : 'text-faint')} strokeWidth={1.75} />
              <span className="min-w-0 flex-1 truncate text-[13.5px]">{i.title}</span>
              <span className="text-[12px] text-muted-foreground">{relativeDay(i.date)}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground">No deadlines this week.</p>
      )}
    </Panel>
  )
}

export function TodayPage() {
  const { data: tasks = [] } = useTasks({ view: 'today' })
  const { openNewTask } = useUI()
  const open = tasks.filter((t) => t.status !== 'done')

  return (
    <Page wide banner="today">
      <PageHeader
        eyebrow="Today"
        title={format(new Date(), 'EEEE, MMMM d')}
        description="What you need to know today."
        actions={
          <Button variant="outline" onClick={() => openNewTask({ dueDate: today() })}>
            <Plus /> Task
          </Button>
        }
      />
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 flex flex-col gap-5 lg:col-span-7">
          <Card className="p-6">
            <div className="mb-4 label-caps">Schedule</div>
            <DayTimeline />
          </Card>
          <Important />
        </div>
        <div className="col-span-12 flex flex-col gap-5 lg:col-span-5">
          <Panel title="Today's tasks" href="/tasks" action={<span className="text-[12px] text-muted-foreground tabular">{open.length} open</span>}>
            {tasks.length ? tasks.map((t) => <TaskRow key={t.id} task={t} />) : <EmptyState compact icon={Sun} title="You're all caught up." />}
            <InlineAddTask defaults={{ dueDate: today() }} />
          </Panel>
          <HabitsToday />
        </div>
      </div>
    </Page>
  )
}
