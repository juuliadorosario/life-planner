import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useUI, type DialogContext } from '@/app/ui-state'
import { useToast } from '@/app/toast'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useAppleCalendar, useCalendarActions } from '@/features/calendar/hooks'
import { useGoalActions } from '@/features/goals/hooks'
import { useProjectActions } from '@/features/projects/hooks'
import { useExam, useStudyActions } from '@/features/study/hooks'
import { dayOffset, today } from '@/lib/dates'
import type { EventCategory, Exam } from '@/types/domain'
import { useLinkTargets } from './useLinkTargets'
import { personal } from '@/config/personal'

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-[12px] text-faint">{hint}</span>}
    </label>
  )
}

export function OptionSelect({ value, onChange, options, placeholder, allowNone }: { value: string | null; onChange: (v: string | null) => void; options: { id: string; name: string }[]; placeholder: string; allowNone?: boolean }) {
  return (
    <Select value={value ?? '__none'} onValueChange={(v) => onChange(v === '__none' ? null : v)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value="__none">None</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function FormDialog({ title, description, open, onClose, onSubmit, submitLabel, disabled, children }: { title: string; description?: string; open: boolean; onClose: () => void; onSubmit: () => void; submitLabel: string; disabled?: boolean; children: ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="gap-5 p-6 sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!disabled) onSubmit()
          }}
        >
          {children}
          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={disabled}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProjectDialog({ onClose }: { onClose: () => void }) {
  const targets = useLinkTargets()
  const { create } = useProjectActions()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [areaId, setAreaId] = useState<string | null>(null)
  const [goalId, setGoalId] = useState<string | null>(null)
  const [deadline, setDeadline] = useState('')
  return (
    <FormDialog
      open
      title="New project"
      description="Projects group tasks, notes and links around one outcome."
      onClose={onClose}
      submitLabel="Create project"
      disabled={!name.trim()}
      onSubmit={() =>
        create.mutate({ name: name.trim(), description: description || null, areaId, goalId, deadline: deadline || null }, {
          onSuccess: (p) => {
            onClose()
            navigate(`/projects/${p.id}`)
          },
        })
      }
    >
      <Field label="Name">
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Website redesign" />
      </Field>
      <Field label="Description">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does done look like?" rows={2} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Area">
          <OptionSelect value={areaId} onChange={setAreaId} options={targets.areas} placeholder="Choose area" allowNone />
        </Field>
        <Field label="Deadline">
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
      </div>
      <Field label="Contributes to goal">
        <OptionSelect value={goalId} onChange={setGoalId} options={targets.goals} placeholder="No goal" allowNone />
      </Field>
    </FormDialog>
  )
}

function GoalDialog({ onClose }: { onClose: () => void }) {
  const targets = useLinkTargets()
  const { create, addMilestone } = useGoalActions()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [areaId, setAreaId] = useState<string | null>(null)
  const [deadline, setDeadline] = useState('')
  const [milestones, setMilestones] = useState('')
  return (
    <FormDialog
      open
      title="New goal"
      description="Milestones are the steps to get there. Ticking them off fills the progress ring."
      onClose={onClose}
      submitLabel="Create goal"
      disabled={!title.trim()}
      onSubmit={() =>
        create.mutate({ title: title.trim(), description: description || null, areaId, deadline: deadline || null }, {
          onSuccess: async (g) => {
            const steps = milestones.split('\n').map((m) => m.trim()).filter(Boolean)
            for (const step of steps) await addMilestone.mutateAsync({ goalId: g.id, title: step })
            onClose()
            navigate(`/goals/${g.id}`)
          },
        })
      }
    >
      <Field label="Goal">
        <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Run a half marathon" />
      </Field>
      <Field label="Why it matters">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Area">
          <OptionSelect value={areaId} onChange={setAreaId} options={targets.areas} placeholder="Choose area" allowNone />
        </Field>
        <Field label="Deadline">
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
      </div>
      <Field label="Milestones" hint="One per line. You can add more later on the goal's page.">
        <Textarea value={milestones} onChange={(e) => setMilestones(e.target.value)} placeholder={'Run 10 km\nRun 15 km\nSign up for the race'} rows={3} />
      </Field>
    </FormDialog>
  )
}

function SessionDialog({ onClose, context }: { onClose: () => void; context: DialogContext }) {
  const targets = useLinkTargets()
  const { createSession } = useStudyActions()
  const toast = useToast()
  const [subjectId, setSubjectId] = useState<string | null>(context.subjectId ?? targets.subjects[0]?.id ?? null)
  const [examId, setExamId] = useState<string | null>(context.examId ?? null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today())
  const [startTime, setStartTime] = useState('16:00')
  const [duration, setDuration] = useState('60')
  const exams = targets.exams.filter((e) => e.status === 'upcoming' && (!subjectId || e.subjectId === subjectId))
  return (
    <FormDialog
      open
      title="New study session"
      description="It will appear on your calendar and under the subject."
      onClose={onClose}
      submitLabel="Add session"
      disabled={!subjectId}
      onSubmit={() =>
        createSession.mutate({ subjectId: subjectId!, examId, title: title || undefined, date, startTime, durationMin: Number(duration) || 60 }, {
          onSuccess: () => {
            onClose()
            toast('Study session added')
          },
        })
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Subject">
          <OptionSelect value={subjectId} onChange={setSubjectId} options={targets.subjects} placeholder="Subject" />
        </Field>
        <Field label="For exam">
          <OptionSelect value={examId} onChange={setExamId} options={exams} placeholder="None" allowNone />
        </Field>
      </div>
      <Field label="Focus">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Past paper, chapter 5…" />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Start">
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field>
        <Field label="Minutes">
          <Input type="number" min={10} step={5} value={duration} onChange={(e) => setDuration(e.target.value)} />
        </Field>
      </div>
    </FormDialog>
  )
}

function ExamDialog({ onClose, context }: { onClose: () => void; context: DialogContext }) {
  const { data: existing, isLoading } = useExam(context.examId ?? '')
  if (context.examId && isLoading) return null
  return <ExamForm onClose={onClose} subjectId={context.subjectId} exam={context.examId ? existing : undefined} />
}

/** New exam, or — when `exam` is given — edit its date, room, topics and grade. */
function ExamForm({ onClose, subjectId: preselected, exam }: { onClose: () => void; subjectId?: string; exam?: Exam }) {
  const targets = useLinkTargets()
  const { createExam, updateExam } = useStudyActions()
  const navigate = useNavigate()
  const [subjectId, setSubjectId] = useState<string | null>(exam?.subjectId ?? preselected ?? targets.subjects[0]?.id ?? null)
  const [title, setTitle] = useState(exam?.title ?? '')
  const [date, setDate] = useState(exam?.date ?? dayOffset(14))
  const [time, setTime] = useState(exam?.time ?? '09:00')
  const [location, setLocation] = useState(exam?.location ?? '')
  const [topics, setTopics] = useState(exam?.topics.join(', ') ?? '')
  const [grade, setGrade] = useState(exam?.grade ?? '')
  const [generatePlan, setGeneratePlan] = useState(true)
  const subjectName = targets.subjects.find((s) => s.id === subjectId)?.name
  const topicList = topics.split(',').map((t) => t.trim()).filter(Boolean)
  if (exam) {
    return (
      <FormDialog
        open
        title="Edit exam"
        onClose={onClose}
        submitLabel="Save"
        disabled={!subjectId || !date}
        onSubmit={() =>
          updateExam.mutate(
            { id: exam.id, patch: { subjectId: subjectId!, title: title.trim() || `${subjectName} exam`, date, time, location, topics: topicList, grade } },
            { onSuccess: onClose },
          )
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Subject">
            <OptionSelect value={subjectId} onChange={setSubjectId} options={targets.subjects} placeholder="Subject" />
          </Field>
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Time">
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <Field label="Room">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
        </div>
        <Field label="Topics" hint="Separate with commas.">
          <Input value={topics} onChange={(e) => setTopics(e.target.value)} />
        </Field>
        <Field label="Grade" hint="Fill it in once you get the result.">
          <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="8.5" />
        </Field>
      </FormDialog>
    )
  }
  return (
    <FormDialog
      open
      title="New exam"
      description="An exam connects to the calendar, the subject and its own study plan."
      onClose={onClose}
      submitLabel="Create exam"
      disabled={!subjectId || !date}
      onSubmit={() =>
        createExam.mutate(
          {
            subjectId: subjectId!,
            title: title.trim() || `${subjectName} exam`,
            date,
            time,
            location,
            topics: topicList,
            generatePlan,
          },
          {
            onSuccess: (id) => {
              onClose()
              navigate(`/study/exams/${id}`)
            },
          },
        )
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Subject">
          <OptionSelect value={subjectId} onChange={setSubjectId} options={targets.subjects} placeholder="Subject" />
        </Field>
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${subjectName ?? 'Subject'} — Unit 3`} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Time">
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
        <Field label="Room">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="204" />
        </Field>
      </div>
      <Field label="Topics" hint="Separate with commas.">
        <Input value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Probability, Statistics" />
      </Field>
      <div className="flex items-start justify-between gap-4 rounded-xl bg-muted/60 p-3.5">
        <div>
          <div className="text-[13px] font-medium">Create a study plan</div>
          <div className="text-[12.5px] text-muted-foreground">Study sessions in the days before and a revision task per topic.</div>
        </div>
        <Switch checked={generatePlan} onCheckedChange={setGeneratePlan} />
      </div>
    </FormDialog>
  )
}

const CATEGORIES: { id: EventCategory; name: string }[] = [
  { id: 'personal', name: 'Personal' },
  { id: 'school', name: 'School' },
  { id: 'study', name: 'Study' },
  { id: 'health', name: 'Health' },
  { id: 'startup', name: 'Startup' },
]

function EventDialog({ onClose }: { onClose: () => void }) {
  const { create } = useCalendarActions()
  const apple = useAppleCalendar()
  const appleReady = apple.status === 'full'
  const writable = apple.calendars.filter((c) => c.writable)
  const [target, setTarget] = useState<'local' | 'apple'>('apple')
  const [calendarId, setCalendarId] = useState<string | null>(null)
  const toApple = appleReady && target === 'apple'
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today())
  const [start, setStart] = useState('18:00')
  const [end, setEnd] = useState('19:00')
  const [category, setCategory] = useState<EventCategory>('personal')
  const [location, setLocation] = useState('')
  const [weekly, setWeekly] = useState(false)
  return (
    <FormDialog
      open
      title="New event"
      onClose={onClose}
      submitLabel="Add event"
      disabled={!title.trim() || end <= start}
      onSubmit={() => {
        const s = new Date(`${date}T${start}:00`)
        create.mutate(
          {
            title: title.trim(),
            start: s,
            end: new Date(`${date}T${end}:00`),
            category,
            location: location || undefined,
            repeatWeekdays: !toApple && weekly ? [s.getDay()] : null,
            target: toApple ? 'apple' : 'local',
            calendarId: toApple ? (calendarId ?? undefined) : undefined,
          },
          {
            onSuccess: () => {
              onClose()
              toast(toApple ? 'Added to Apple Calendar' : 'Event added')
            },
          },
        )
      }}
    >
      <Field label="Title">
        <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Coffee with Marta" />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Start">
          <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="End">
          <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <OptionSelect value={category} onChange={(v) => setCategory((v as EventCategory) ?? 'personal')} options={CATEGORIES} placeholder="Category" />
        </Field>
        <Field label="Location">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>
      </div>
      {appleReady && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Save to">
            <OptionSelect value={target} onChange={(v) => setTarget((v as 'local' | 'apple') ?? 'apple')} options={[{ id: 'apple', name: 'Apple Calendar' }, { id: 'local', name: `${personal.appName} only` }]} placeholder="Save to" />
          </Field>
          {toApple && (
            <Field label="Calendar">
              <OptionSelect value={calendarId} onChange={setCalendarId} options={writable.map((c) => ({ id: c.id, name: c.title }))} placeholder="Default calendar" allowNone />
            </Field>
          )}
        </div>
      )}
      {!toApple && (
        <label className="flex items-center justify-between rounded-xl bg-muted/60 p-3.5 text-[13px]">
          Repeat every week
          <Switch checked={weekly} onCheckedChange={setWeekly} />
        </label>
      )}
    </FormDialog>
  )
}

/** Create dialogs opened from the command palette and page headers. */
export function CreateDialogs() {
  const { dialog, dialogContext, openDialog } = useUI()
  const close = () => openDialog(undefined)
  switch (dialog) {
    case 'project':
      return <ProjectDialog onClose={close} />
    case 'goal':
      return <GoalDialog onClose={close} />
    case 'session':
      return <SessionDialog onClose={close} context={dialogContext} />
    case 'exam':
      return <ExamDialog onClose={close} context={dialogContext} />
    case 'event':
      return <EventDialog onClose={close} />
    default:
      return null
  }
}
