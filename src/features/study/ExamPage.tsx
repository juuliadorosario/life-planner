import { Link, useNavigate, useParams } from 'react-router'
import { format } from 'date-fns'
import { CalendarDays, Clock, MapPin, Pencil, Trash2 } from 'lucide-react'
import { useUI } from '@/app/ui-state'
import { Card, Panel } from '@/components/common/Card'
import { CheckCircle } from '@/components/common/CheckCircle'
import { EmptyState } from '@/components/common/EmptyState'
import { Page } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { BackLink } from '@/features/shared/DetailBits'
import { NotesList } from '@/features/shared/NotesList'
import { TaskRow } from '@/features/tasks/TaskRow'
import { InlineAddTask } from '@/features/tasks/TasksPage'
import { daysUntil, parseDay, relativeDay } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { useExam, useExamRelations, useStudyActions, useSubjects } from './hooks'

export function ExamPage() {
  const { id = '' } = useParams()
  const { data: exam, isLoading } = useExam(id)
  const { data: rel } = useExamRelations(id)
  const { data: subjects = [] } = useSubjects()
  const { toggleSession, setExamDone, deleteExam, toggleTopic } = useStudyActions()
  const navigate = useNavigate()
  const { openDialog } = useUI()
  if (isLoading) return null
  if (!exam) return <Page><EmptyState title="Exam not found." /></Page>
  const subject = subjects.find((s) => s.id === exam.subjectId)
  const days = daysUntil(exam.date)
  const topics = subject?.topics.filter((t) => exam.topics.includes(t.name)) ?? []

  return (
    <Page wide>
      <BackLink to={subject ? `/study/subjects/${subject.id}` : '/study'}>{subject?.name ?? 'Study'}</BackLink>
      <Card className="mb-5 flex flex-wrap items-end justify-between gap-6 p-8">
        <div>
          <div className="label-caps">Exam · {subject?.name}</div>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.025em]">{exam.title}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{format(parseDay(exam.date), 'EEEE, MMMM d')}</span>
            {exam.time && <span className="flex items-center gap-1.5"><Clock className="size-3.5" />{exam.time}</span>}
            {exam.location && <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{exam.location}</span>}
          </div>
          {exam.description && <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-muted-foreground">{exam.description}</p>}
        </div>
        <div className="flex items-end gap-6">
          {exam.status === 'upcoming' ? (
            <div className="text-right">
              <div className={cn('text-[48px] leading-none figure tabular', days <= 3 && 'text-destructive')}>{Math.max(days, 0)}</div>
              <div className="mt-1 text-[13px] text-muted-foreground">days to go</div>
            </div>
          ) : (
            <div className="text-right">
              <div className="text-[40px] leading-none figure tabular">{exam.grade ?? '—'}</div>
              <div className="mt-1 text-[13px] text-muted-foreground">grade</div>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Button variant="outline" size="sm" onClick={() => openDialog('exam', { examId: id })}>
              <Pencil /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setExamDone.mutate({ id, done: exam.status !== 'done' })}>
              {exam.status === 'done' ? 'Mark upcoming' : 'Mark as done'}
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => deleteExam.mutate(id, { onSuccess: () => navigate('/study') })}>
              <Trash2 /> Delete
            </Button>
          </div>
        </div>
      </Card>

      {rel && (
        <p className="mb-5 text-[13px] text-muted-foreground">
          Connected: {rel.sessions.length} study sessions · {rel.tasks.length} tasks · {rel.notes.length} notes · on your calendar
        </p>
      )}

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 flex flex-col gap-5 lg:col-span-7">
          <Panel title="Study plan">
            {rel?.sessions.length ? (
              <ol className="relative flex flex-col">
                {rel.sessions.map((s) => (
                  <li key={s.id} className="flex items-center gap-4 py-2.5">
                    <CheckCircle checked={s.done} onChange={(done) => toggleSession.mutate({ id: s.id, done })} />
                    <div className="min-w-0 flex-1">
                      <div className={cn('text-[14px]', s.done && 'text-muted-foreground line-through')}>{s.title ?? 'Study session'}</div>
                      <div className="text-[12px] text-muted-foreground">{relativeDay(s.date)} · {s.startTime} · {s.durationMin} min</div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[13px] text-muted-foreground">No sessions linked yet.</p>
            )}
          </Panel>
          <Panel title="Tasks">
            {rel?.tasks.map((t) => <TaskRow key={t.id} task={t} showContext={false} />)}
            <InlineAddTask defaults={{ examId: id, subjectId: exam.subjectId }} placeholder="Add a revision task" />
          </Panel>
        </div>
        <div className="col-span-12 flex flex-col gap-5 lg:col-span-5">
          <Panel title="Topics">
            {topics.length ? (
              topics.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-1.5">
                  <CheckCircle size="sm" checked={t.done} onChange={(done) => toggleTopic.mutate({ id: t.id, done })} />
                  <span className={cn('text-[13.5px]', t.done && 'text-muted-foreground')}>{t.name}</span>
                </div>
              ))
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {exam.topics.map((t) => <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-[12px]">{t}</span>)}
              </div>
            )}
          </Panel>
          <NotesList filter={{ examId: id }} defaults={{ examId: id, subjectId: exam.subjectId, folder: 'Study' }} />
          {subject && (
            <Link to={`/study/subjects/${subject.id}`} className="text-[12.5px] text-muted-foreground hover:text-foreground">
              Open {subject.name} →
            </Link>
          )}
        </div>
      </div>
    </Page>
  )
}
