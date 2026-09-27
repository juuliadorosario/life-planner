import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { useUI } from '@/app/ui-state'
import { Panel } from '@/components/common/Card'
import { CheckCircle } from '@/components/common/CheckCircle'
import { EmptyState } from '@/components/common/EmptyState'
import { Page, PageHeader } from '@/components/common/PageHeader'
import { ProgressRing } from '@/components/common/Progress'
import { Button } from '@/components/ui/button'
import { PhotoSlot } from '@/features/photos/PhotoSlot'
import { SubjectCover } from './SubjectCover'
import { BackLink } from '@/features/shared/DetailBits'
import { LinksPanel } from '@/features/shared/LinksPanel'
import { NotesList } from '@/features/shared/NotesList'
import { useTasks } from '@/features/tasks/hooks'
import { TaskRow } from '@/features/tasks/TaskRow'
import { InlineAddTask } from '@/features/tasks/TasksPage'
import { daysUntil, parseDay, relativeDay } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { useAssignments, useExams, useStudyActions, useStudySessions, useSubjects } from './hooks'

export function SubjectPage() {
  const { id = '' } = useParams()
  const { data: subjects = [], isLoading } = useSubjects()
  const { data: exams = [] } = useExams({ subjectId: id })
  const { data: assignments = [] } = useAssignments(id)
  const { data: sessions = [] } = useStudySessions({ subjectId: id })
  const { data: tasks = [] } = useTasks({ subjectId: id })
  const { toggleTopic, addTopic, toggleAssignment, toggleSession } = useStudyActions()
  const { openDialog } = useUI()
  const [topic, setTopic] = useState('')
  const subject = subjects.find((s) => s.id === id)
  if (isLoading) return null
  if (!subject) return <Page><EmptyState title="Subject not found." /></Page>
  const upcoming = exams.filter((e) => e.status === 'upcoming')

  return (
    <Page wide>
      <BackLink to="/study">Study</BackLink>
      <PhotoSlot slot={`cover.subject.${id}`} fallbackNode={<SubjectCover name={subject.name} index={subjects.findIndex((s) => s.id === id)} large />} className="mb-8 h-[180px] w-full" rounded="rounded-xl" placeholder="Add a cover photo" />
      <PageHeader eyebrow="Subject" title={subject.name} description={subject.teacher ?? undefined} actions={<Button variant="outline" onClick={() => openDialog('session')}><Plus /> Study session</Button>} />
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 flex flex-col gap-5 lg:col-span-8">
          <Panel title="Topics" action={<span className="text-[12px] text-muted-foreground tabular">{subject.topics.filter((t) => t.done).length}/{subject.topics.length}</span>}>
            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              {subject.topics.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2">
                  <CheckCircle checked={t.done} onChange={(done) => toggleTopic.mutate({ id: t.id, done })} />
                  <span className={cn('text-[14px]', t.done && 'text-muted-foreground')}>{t.name}</span>
                </div>
              ))}
            </div>
            <form className="mt-1 flex items-center gap-3 py-2 text-muted-foreground" onSubmit={(e) => { e.preventDefault(); if (topic.trim()) { addTopic.mutate({ subjectId: id, name: topic.trim() }); setTopic('') } }}>
              <Plus className="size-[18px] p-0.5" />
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Add a topic" className="flex-1 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground" />
            </form>
          </Panel>
          <Panel title="Tasks">
            {tasks.map((t) => <TaskRow key={t.id} task={t} showContext={false} />)}
            <InlineAddTask defaults={{ subjectId: id }} placeholder={`Add a ${subject.name.toLowerCase()} task`} />
          </Panel>
          <NotesList filter={{ subjectId: id }} defaults={{ subjectId: id, folder: 'Study' }} />
        </div>
        <div className="col-span-12 flex flex-col gap-5 lg:col-span-4">
          <Panel title="Progress">
            <div className="flex items-center gap-5">
              <ProgressRing value={subject.progress} size={72} stroke={5}>
                <span className="text-[15px] font-semibold tabular">{subject.progress}%</span>
              </ProgressRing>
              <div className="text-[13px] text-muted-foreground">
                {upcoming[0] ? (
                  <>
                    Next exam
                    <Link to={`/study/exams/${upcoming[0].id}`} className="block text-[14px] font-medium text-foreground hover:text-primary">
                      {format(parseDay(upcoming[0].date), 'MMMM d')}
                    </Link>
                    in {daysUntil(upcoming[0].date)} days
                  </>
                ) : (
                  'No exam scheduled'
                )}
              </div>
            </div>
          </Panel>
          <Panel title="Exams">
            {exams.map((e) => (
              <Link key={e.id} to={`/study/exams/${e.id}`} className="-mx-2 flex justify-between gap-3 rounded-lg px-2 py-2 text-[13px] hover:bg-muted/60">
                <span className="truncate">{e.title}</span>
                <span className="shrink-0 text-muted-foreground">{e.status === 'done' ? (e.grade ?? 'Done') : relativeDay(e.date)}</span>
              </Link>
            ))}
            {!exams.length && <p className="text-[13px] text-muted-foreground">None yet.</p>}
          </Panel>
          <Panel title="Assignments">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-1.5">
                <CheckCircle size="sm" checked={a.done} onChange={(done) => toggleAssignment.mutate({ id: a.id, done })} />
                <span className={cn('flex-1 truncate text-[13px]', a.done && 'text-muted-foreground line-through')}>{a.title}</span>
                {a.dueDate && <span className="text-[12px] text-muted-foreground">{relativeDay(a.dueDate)}</span>}
              </div>
            ))}
            {!assignments.length && <p className="text-[13px] text-muted-foreground">None.</p>}
          </Panel>
          <Panel title="Study sessions">
            {sessions.slice(-6).map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-1.5">
                <CheckCircle size="sm" checked={s.done} onChange={(done) => toggleSession.mutate({ id: s.id, done })} />
                <span className={cn('flex-1 truncate text-[13px]', s.done && 'text-muted-foreground')}>{s.title ?? 'Session'}</span>
                <span className="text-[12px] text-muted-foreground">{relativeDay(s.date)} · {s.durationMin}m</span>
              </div>
            ))}
          </Panel>
          <LinksPanel title="Resources" filter={{ subjectId: id }} />
        </div>
      </div>
    </Page>
  )
}
