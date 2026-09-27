import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { format, startOfWeek } from 'date-fns'
import { Dumbbell, Plus, Trash2, X } from 'lucide-react'
import { Card, CardHeader, Panel } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { Page, PageHeader } from '@/components/common/PageHeader'
import { ProgressBar } from '@/components/common/Progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useGoals } from '@/features/goals/hooks'
import { Field, FormDialog, OptionSelect } from '@/features/shared/CreateDialogs'
import { TabBar, useTab } from '@/features/shared/TabBar'
import { useLinkTargets } from '@/features/shared/useLinkTargets'
import { dayOffset, parseDay, relativeDay, toDay, today } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { useHabitLogs, useHabits, useHealthActions, useSleep, useWorkouts } from './hooks'
import { PilatesLibrary, TodaysPilates } from './PilatesLibrary'

const TABS = ['overview', 'pilates', 'workouts', 'habits', 'sleep'] as const

function HabitGrid({ days }: { days: number }) {
  const { data: habits = [] } = useHabits()
  const from = dayOffset(-(days - 1))
  const { data: logs = [] } = useHabitLogs(from, today())
  const { toggleHabit, archiveHabit } = useHealthActions()
  const dates = useMemo(() => Array.from({ length: days }, (_, i) => dayOffset(i - days + 1)), [days])
  const done = new Set(logs.map((l) => `${l.habitId}:${l.date}`))
  const weekStart = toDay(startOfWeek(new Date(), { weekStartsOn: 1 }))

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-1">
        <thead>
          <tr>
            <th />
            {dates.map((d) => (
              <th key={d} className={cn('pb-2 text-center text-[10.5px] font-medium', d === today() ? 'text-foreground' : 'text-faint')}>
                {days <= 7 ? format(parseDay(d), 'EEE') : format(parseDay(d), 'EEEEE')}
                {days <= 7 && <div className="text-[12px] tabular">{format(parseDay(d), 'd')}</div>}
              </th>
            ))}
            <th className="pb-2 pl-4 text-right text-[10.5px] font-medium text-faint">Week</th>
          </tr>
        </thead>
        <tbody>
          {habits.map((h) => {
            const week = logs.filter((l) => l.habitId === h.id && l.date >= weekStart).length
            return (
              <tr key={h.id} className="group/h">
                <td className="pr-4 text-[13.5px] whitespace-nowrap">
                  <span className="flex items-center gap-2">
                    {h.name}
                    {days > 7 && (
                      <button onClick={() => archiveHabit.mutate(h.id)} className="opacity-0 group-hover/h:opacity-100" aria-label={`Archive ${h.name}`}>
                        <X className="size-3 text-muted-foreground" />
                      </button>
                    )}
                  </span>
                </td>
                {dates.map((d) => {
                  const on = done.has(`${h.id}:${d}`)
                  return (
                    <td key={d} className="text-center">
                      <button
                        onClick={() => toggleHabit.mutate({ habitId: h.id, date: d })}
                        className={cn(
                          'mx-auto block rounded-md transition-all duration-200',
                          days <= 7 ? 'size-7' : 'size-[18px] rounded-[5px]',
                          on ? 'bg-primary/85 hover:bg-primary' : 'bg-muted hover:bg-border-strong',
                          d === today() && !on && 'ring-1 ring-border-strong',
                        )}
                        aria-label={`${h.name} on ${d}`}
                        aria-pressed={on}
                      />
                    </td>
                  )
                })}
                <td className="pl-4 text-right text-[12.5px] text-muted-foreground tabular">
                  <span className={cn(week >= h.targetPerWeek && 'font-medium text-primary')}>{week}</span>/{h.targetPerWeek}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SleepBars({ days }: { days: number }) {
  const { data: logs = [] } = useSleep(days)
  const nights = [...logs].reverse()
  const avg = nights.length ? nights.reduce((a, n) => a + n.hours, 0) / nights.length : 0
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-[30px] leading-none figure tabular">{avg.toFixed(1)}h</span>
        <span className="text-[13px] text-muted-foreground">average, last {nights.length} nights</span>
      </div>
      <div className="relative mt-6 flex h-36 items-end gap-1.5">
        <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border-strong" style={{ bottom: `${(8 / 10) * 100}%` }}>
          <span className="absolute -top-4 right-0 text-[10.5px] text-faint">8h</span>
        </div>
        {nights.map((n) => (
          <div key={n.date} className="flex flex-1 flex-col items-center gap-1.5" title={`${n.hours}h · quality ${n.quality}/5`}>
            <div className={cn('w-full max-w-7 rounded-t-[5px]', n.hours >= 7.5 ? 'bg-primary/75' : 'bg-primary/30')} style={{ height: `${(n.hours / 10) * 100}%` }} />
            <span className="text-[10px] text-faint">{format(parseDay(n.date), days > 7 ? 'd' : 'EEE')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LogSleep() {
  const { logSleep } = useHealthActions()
  const [hours, setHours] = useState('7.5')
  const [quality, setQuality] = useState(3)
  const [done, setDone] = useState(false)
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        logSleep.mutate({ date: today(), hours: Number(hours), quality }, { onSuccess: () => setDone(true) })
      }}
    >
      <Field label="Last night (hours)">
        <Input type="number" step={0.25} min={0} max={14} value={hours} onChange={(e) => setHours(e.target.value)} className="w-28" />
      </Field>
      <Field label="Quality">
        <div className="flex h-8 gap-1">
          {[1, 2, 3, 4, 5].map((q) => (
            <button type="button" key={q} onClick={() => setQuality(q)} className={cn('size-8 rounded-md text-[12.5px] tabular', q <= quality ? 'bg-primary-soft text-primary' : 'bg-muted text-muted-foreground')}>
              {q}
            </button>
          ))}
        </div>
      </Field>
      <Button type="submit" variant="outline">{done ? 'Saved' : 'Log sleep'}</Button>
    </form>
  )
}

function WorkoutDialog({ onClose }: { onClose: () => void }) {
  const { createWorkout } = useHealthActions()
  const { data: habits = [] } = useHabits()
  const { goals } = useLinkTargets()
  const workoutHabit = habits.find((h) => /workout|gym|train/i.test(h.name))
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<string | null>('pilates')
  const [date, setDate] = useState(today())
  const [duration, setDuration] = useState('45')
  const [calories, setCalories] = useState('')
  const [notes, setNotes] = useState('')
  const [goalId, setGoalId] = useState<string | null>(goals.find((g) => /train/i.test(g.name))?.id ?? null)
  const [exercises, setExercises] = useState([{ name: '', sets: '3', reps: '10', weight: '' }])
  return (
    <FormDialog
      open
      title="Log workout"
      description={workoutHabit ? `Also ticks “${workoutHabit.name}” for that day.` : undefined}
      onClose={onClose}
      submitLabel="Save workout"
      disabled={!title.trim()}
      onSubmit={() =>
        createWorkout.mutate(
          {
            title: title.trim(),
            kind: kind ?? 'strength',
            date,
            durationMin: Number(duration) || 0,
            calories: calories ? Number(calories) : null,
            notes: notes || null,
            goalId,
            habitId: workoutHabit?.id ?? null,
            exercises: exercises.filter((e) => e.name.trim()).map((e) => ({ name: e.name.trim(), sets: Number(e.sets) || null, reps: Number(e.reps) || null, weightKg: e.weight ? Number(e.weight) : null })),
          },
          { onSuccess: onClose },
        )
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Workout"><Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Upper body" /></Field>
        <Field label="Type"><OptionSelect value={kind} onChange={setKind} options={['pilates', 'strength', 'cardio', 'mobility', 'sport'].map((k) => ({ id: k, name: k[0].toUpperCase() + k.slice(1) }))} placeholder="Type" /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Minutes"><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></Field>
        <Field label="Calories"><Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} /></Field>
      </div>
      <Field label="Exercises">
        <div className="flex flex-col gap-1.5">
          {exercises.map((ex, i) => (
            <div key={i} className="grid grid-cols-[1fr_52px_52px_64px] gap-1.5">
              <Input value={ex.name} onChange={(e) => setExercises(exercises.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Exercise" />
              <Input value={ex.sets} onChange={(e) => setExercises(exercises.map((x, j) => (j === i ? { ...x, sets: e.target.value } : x)))} placeholder="Sets" aria-label="Sets" />
              <Input value={ex.reps} onChange={(e) => setExercises(exercises.map((x, j) => (j === i ? { ...x, reps: e.target.value } : x)))} placeholder="Reps" aria-label="Reps" />
              <Input value={ex.weight} onChange={(e) => setExercises(exercises.map((x, j) => (j === i ? { ...x, weight: e.target.value } : x)))} placeholder="kg" aria-label="Weight" />
            </div>
          ))}
          <button type="button" onClick={() => setExercises([...exercises, { name: '', sets: '3', reps: '10', weight: '' }])} className="flex items-center gap-1.5 self-start text-[12.5px] text-muted-foreground hover:text-foreground">
            <Plus className="size-3.5" /> Add exercise
          </button>
        </div>
      </Field>
      <Field label="Health goal"><OptionSelect value={goalId} onChange={setGoalId} options={goals} placeholder="None" allowNone /></Field>
      <Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></Field>
    </FormDialog>
  )
}

function WorkoutList({ limit }: { limit: number }) {
  const { data: workouts = [] } = useWorkouts(limit)
  const { deleteWorkout } = useHealthActions()
  if (!workouts.length) return <EmptyState compact icon={Dumbbell} title="No workouts yet." />
  return (
    <div className="divide-y divide-border">
      {workouts.map((w) => (
        <div key={w.id} className="group/w flex items-start gap-4 py-3.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Dumbbell className="size-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[14px] font-medium">{w.title}</span>
              <span className="text-[12px] text-muted-foreground">{relativeDay(w.date)}</span>
            </div>
            <div className="text-[12.5px] text-muted-foreground tabular">
              {w.durationMin} min{w.calories ? ` · ${w.calories} kcal` : ''} · <span className="capitalize">{w.kind}</span>
            </div>
            {w.exercises.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {w.exercises.map((e) => (
                  <span key={e.id} className="rounded-md bg-muted/70 px-2 py-0.5 text-[11.5px] text-muted-foreground tabular">
                    {e.name} {e.sets && e.reps ? `${e.sets}×${e.reps}` : ''}
                    {e.weightKg ? ` · ${e.weightKg}kg` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => deleteWorkout.mutate(w.id)} className="opacity-0 transition-opacity group-hover/w:opacity-100" aria-label="Delete workout">
            <Trash2 className="size-3.5 text-muted-foreground" />
          </button>
        </div>
      ))}
    </div>
  )
}

function NewHabit() {
  const { createHabit } = useHealthActions()
  const [name, setName] = useState('')
  const [target, setTarget] = useState('7')
  return (
    <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { createHabit.mutate({ name: name.trim(), targetPerWeek: Number(target) || 7 }); setName('') } }}>
      <Field label="New habit"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Stretch 10 min" className="w-56" /></Field>
      <Field label="Per week"><Input type="number" min={1} max={7} value={target} onChange={(e) => setTarget(e.target.value)} className="w-20" /></Field>
      <Button type="submit" variant="outline"><Plus /> Add</Button>
    </form>
  )
}

export function HealthPage() {
  const [tab, setTab] = useTab(TABS)
  const [logging, setLogging] = useState(false)
  const { data: goals = [] } = useGoals()
  const { data: workouts = [] } = useWorkouts(30)
  const weekStart = toDay(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const thisWeek = workouts.filter((w) => w.date >= weekStart)
  const healthGoals = goals.filter((g) => /train|health|sleep|run/i.test(g.title))

  return (
    <Page wide banner="health">
      <PageHeader eyebrow="Health" title="Wellbeing" actions={<Button onClick={() => setLogging(true)}><Plus /> Log workout</Button>} />
      <TabBar tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid grid-cols-12 gap-5">
          <Panel title="This week" className="col-span-12 lg:col-span-8">
            <HabitGrid days={7} />
          </Panel>
          <div className="col-span-12 flex flex-col gap-5 lg:col-span-4">
            <TodaysPilates />
            <Panel title="Training">
              <div className="flex items-end gap-2">
                <span className="text-[30px] leading-none figure tabular">{thisWeek.length}</span>
                <span className="pb-0.5 text-[13px] text-muted-foreground">workouts · {thisWeek.reduce((a, w) => a + w.durationMin, 0)} min this week</span>
              </div>
              {healthGoals.map((g) => (
                <Link key={g.id} to={`/goals/${g.id}`} className="mt-5 block">
                  <div className="mb-1.5 flex justify-between text-[13px]"><span>{g.title}</span><span className="text-muted-foreground tabular">{g.computedProgress}%</span></div>
                  <ProgressBar value={g.computedProgress} />
                </Link>
              ))}
            </Panel>
            <Card className="p-5">
              <CardHeader title="Sleep" />
              <div className="mt-3"><SleepBars days={7} /></div>
            </Card>
          </div>
          <Panel title="Recent workouts" className="col-span-12">
            <WorkoutList limit={4} />
          </Panel>
        </div>
      )}
      {tab === 'pilates' && <PilatesLibrary />}
      {tab === 'workouts' && <Card className="max-w-3xl px-6 py-2"><WorkoutList limit={50} /></Card>}
      {tab === 'habits' && (
        <Card className="p-6">
          <CardHeader title="Last 4 weeks" />
          <div className="mt-4"><HabitGrid days={28} /></div>
          <div className="mt-6 border-t border-border pt-5"><NewHabit /></div>
        </Card>
      )}
      {tab === 'sleep' && (
        <Card className="max-w-3xl p-6">
          <SleepBars days={14} />
          <div className="mt-8 border-t border-border pt-5"><LogSleep /></div>
        </Card>
      )}
      {logging && <WorkoutDialog onClose={() => setLogging(false)} />}
    </Page>
  )
}
