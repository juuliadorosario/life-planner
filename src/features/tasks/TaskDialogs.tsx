import { useEffect, useState } from 'react'
import { BookOpen, CalendarDays, FileText, Flag, FolderKanban, Pin, Target, Trash2 } from 'lucide-react'
import { useUI, type TaskDefaults } from '@/app/ui-state'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Kbd } from '@/components/common/Kbd'
import { dayOffset, today } from '@/lib/dates'
import { TASK_KINDS, kindOf, withKind } from '@/lib/taskKinds'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/domain'
import { LinkSelect } from '@/features/shared/LinkSelect'
import { useLinkTargets } from '@/features/shared/useLinkTargets'
import { useTaskActions, useTasks } from './hooks'

type Draft = Pick<Task, 'title' | 'description' | 'dueDate' | 'priority' | 'projectId' | 'subjectId' | 'goalId' | 'examId' | 'areaId' | 'tags'>

const EMPTY: Draft = { title: '', description: null, dueDate: null, priority: 0, projectId: null, subjectId: null, goalId: null, examId: null, areaId: null, tags: [] }

const PRIORITIES = [
  { id: '0', name: 'No priority' },
  { id: '1', name: 'Low' },
  { id: '2', name: 'Medium' },
  { id: '3', name: 'High' },
]

function DuePicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const presets = [
    { label: 'Today', value: today() },
    { label: 'Tomorrow', value: dayOffset(1) },
    { label: 'Next week', value: dayOffset(7) },
  ]
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {presets.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => onChange(value === p.value ? null : p.value)}
          className={cn(
            'h-7 rounded-full border px-2.5 text-[12.5px] transition-colors',
            value === p.value ? 'border-primary/40 bg-primary-soft text-primary' : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          {p.label}
        </button>
      ))}
      <label className="relative flex h-7 items-center gap-1.5 rounded-full border border-border px-2.5 text-[12.5px] text-muted-foreground hover:text-foreground">
        <CalendarDays className="size-3.5" strokeWidth={1.75} />
        <input
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-[108px] bg-transparent text-[12.5px] text-foreground outline-none [&::-webkit-calendar-picker-indicator]:opacity-50"
        />
      </label>
    </div>
  )
}

/** Shared form body for creating and editing a task. */
function TaskForm({
  draft,
  setDraft,
  onSubmit,
  autoFocus,
}: {
  draft: Draft
  setDraft: (d: Draft) => void
  onSubmit: () => void
  autoFocus?: boolean
}) {
  const targets = useLinkTargets()
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft({ ...draft, [k]: v })
  return (
    <div className="flex flex-col gap-4">
      <input
        autoFocus={autoFocus}
        value={draft.title}
        onChange={(e) => set('title', e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSubmit()
          }
        }}
        placeholder="What needs to be done?"
        className="w-full bg-transparent text-[17px] font-medium tracking-[-0.01em] outline-none placeholder:text-faint"
      />
      <textarea
        value={draft.description ?? ''}
        onChange={(e) => set('description', e.target.value || null)}
        placeholder="Add details…"
        rows={2}
        className="w-full resize-none bg-transparent text-[13.5px] leading-relaxed text-foreground outline-none placeholder:text-faint"
      />
      <DuePicker value={draft.dueDate} onChange={(v) => set('dueDate', v)} />
      <div className="flex flex-wrap gap-1.5">
        <LinkSelect icon={Pin} placeholder="Kind" value={kindOf(draft.tags)} options={[...TASK_KINDS]} onChange={(v) => set('tags', withKind(draft.tags, v))} />
        <LinkSelect icon={Flag} placeholder="Priority" value={draft.priority ? String(draft.priority) : null} options={PRIORITIES.slice(1)} onChange={(v) => set('priority', Number(v ?? 0))} />
        <LinkSelect icon={FolderKanban} placeholder="Project" value={draft.projectId} options={targets.projects} onChange={(v) => {
          const project = targets.projects.find((p) => p.id === v)
          setDraft({ ...draft, projectId: v, areaId: project?.areaId ?? draft.areaId })
        }} />
        <LinkSelect icon={BookOpen} placeholder="Subject" value={draft.subjectId} options={targets.subjects} onChange={(v) => {
          const study = targets.areas.find((a) => a.slug === 'study')
          setDraft({ ...draft, subjectId: v, areaId: v ? (study?.id ?? draft.areaId) : draft.areaId })
        }} />
        <LinkSelect icon={FileText} placeholder="Exam" value={draft.examId} options={targets.exams.filter((e) => e.status === 'upcoming')} onChange={(v) => {
          const exam = targets.exams.find((e) => e.id === v)
          setDraft({ ...draft, examId: v, subjectId: exam?.subjectId ?? draft.subjectId })
        }} />
        <LinkSelect icon={Target} placeholder="Goal" value={draft.goalId} options={targets.goals} onChange={(v) => set('goalId', v)} />
      </div>
    </div>
  )
}

function NewTaskDialog({ defaults, onClose }: { defaults: TaskDefaults; onClose: () => void }) {
  const [draft, setDraft] = useState<Draft>({ ...EMPTY, ...defaults } as Draft)
  const { create } = useTaskActions()
  const submit = () => {
    if (!draft.title.trim()) return
    create.mutate({ ...draft, title: draft.title.trim() }, { onSuccess: onClose })
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="top-[22%] translate-y-0 gap-0 p-0 sm:max-w-[560px]">
        <DialogTitle className="sr-only">New task</DialogTitle>
        <div className="p-5">
          <TaskForm draft={draft} setDraft={setDraft} onSubmit={submit} autoFocus />
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Kbd>↵</Kbd> to create
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={!draft.title.trim()}>
              Create task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TaskDetailDialog({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { data: tasks } = useTasks({ includeDone: true })
  const task = tasks?.find((t) => t.id === taskId)
  const { update, remove, toggle } = useTaskActions()
  const [draft, setDraft] = useState<Draft | null>(null)

  useEffect(() => {
    if (task && !draft) setDraft({ ...task })
  }, [task, draft])

  if (!task || !draft) return null
  const save = () => {
    if (!draft.title.trim()) return
    update.mutate({ id: task.id, patch: { ...draft, title: draft.title.trim() } }, { onSuccess: onClose })
  }
  const done = task.status === 'done'

  return (
    <Dialog open onOpenChange={(o) => !o && save()}>
      <DialogContent showCloseButton={false} className="top-[22%] translate-y-0 gap-0 p-0 sm:max-w-[560px]">
        <DialogTitle className="sr-only">Edit task</DialogTitle>
        <div className="p-5">
          <TaskForm draft={draft} setDraft={setDraft} onSubmit={save} />
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => remove.mutate(task.id, { onSuccess: onClose })}
            >
              <Trash2 /> Delete
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => toggle.mutate({ id: task.id, done: !done }, { onSuccess: onClose })}>
              {done ? 'Mark as not done' : 'Mark as done'}
            </Button>
          </div>
          <Button size="sm" onClick={save}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Mounted once in the shell; driven by `useUI()`. */
export function TaskDialogs() {
  const { newTask, closeNewTask, openTaskId, openTask } = useUI()
  return (
    <>
      {newTask && <NewTaskDialog defaults={newTask} onClose={closeNewTask} />}
      {openTaskId && <TaskDetailDialog key={openTaskId} taskId={openTaskId} onClose={() => openTask(undefined)} />}
    </>
  )
}
