import { Link } from 'react-router'
import { format } from 'date-fns'
import { CalendarPlus, FileText, Plus } from 'lucide-react'
import { useUI } from '@/app/ui-state'
import { Card, Panel } from '@/components/common/Card'
import { CheckCircle } from '@/components/common/CheckCircle'
import { Page, PageHeader } from '@/components/common/PageHeader'
import { ProgressBar } from '@/components/common/Progress'
import { Button } from '@/components/ui/button'
import { PhotoSlot } from '@/features/photos/PhotoSlot'
import { SubjectCover } from './SubjectCover'
import { dayOffset, daysUntil, parseDay, relativeDay, today } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { useAssignments, useExams, useStudyActions, useStudyMinutes, useStudySessions, useSubjects } from './hooks'

export function StudyPage() {
  const { data: subjects = [] } = useSubjects()
  const { data: exams = [] } = useExams({ upcomingOnly: true })
  const { data: assignments = [] } = useAssignments()
  const { data: sessions = [] } = useStudySessions({ from: today(), to: dayOffset(7) })
  const { data: minutes } = useStudyMinutes(7)
  const { toggleAssignment, toggleSession } = useStudyActions()
  const { openDialog } = useUI()
  const totalMin = minutes ? [...minutes.values()].reduce((a, b) => a + b, 0) : 0
  const subjectName = (id: string | null) => subjects.find((s) => s.id === id)?.name ?? ''

  return (
    <Page wide banner="study">
      <PageHeader
        eyebrow="Study"
        title="Studies"
        description={`${(totalMin / 60).toFixed(1)} hours studied this week · ${exams.length} exams coming up`}
        actions={
          <>
            <Button variant="outline" onClick={() => openDialog('session')}>
              <CalendarPlus /> Session
            </Button>
            <Button onClick={() => openDialog('exam')}>
              <FileText /> New exam
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {subjects.map((s, i) => (
          <Link key={s.id} to={`/study/subjects/${s.id}`} className="group/s">
            <Card className="flex h-full flex-col overflow-hidden transition-[border-color,transform] duration-200 group-hover/s:-translate-y-0.5 group-hover/s:border-border-strong">
              <PhotoSlot slot={`cover.subject.${s.id}`} fallbackNode={<SubjectCover name={s.name} index={i} />} className="aspect-[16/10] w-full" rounded="rounded-none" placeholder="Add a cover" />
              <div className="flex flex-1 flex-col p-5">
              <div className="display text-title-soft text-[20px] leading-tight">{s.name}</div>
              <div className="text-[12px] text-muted-foreground">{s.teacher}</div>
              <div className="mt-6 flex items-end justify-between">
                <span className="text-[28px] leading-none figure tabular">{s.progress}%</span>
                <span className="text-[11.5px] text-muted-foreground tabular">
                  {s.topics.filter((t) => t.done).length}/{s.topics.length} topics
                </span>
              </div>
              <ProgressBar value={s.progress} className="mt-3" />
              <div className={cn('mt-4 text-[12px]', s.nextExam && daysUntil(s.nextExam.date) <= 7 ? 'text-destructive/90' : 'text-muted-foreground')}>
                {s.nextExam ? `Exam ${format(parseDay(s.nextExam.date), 'MMM d')} · in ${daysUntil(s.nextExam.date)} days` : 'No exam scheduled'}
              </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-12 gap-5">
        <Panel title="Upcoming exams" className="col-span-12 lg:col-span-4">
          {exams.length ? (
            exams.map((e) => (
              <Link key={e.id} to={`/study/exams/${e.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60">
                <div className="grid w-10 text-center leading-none">
                  <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">{format(parseDay(e.date), 'MMM')}</span>
                  <span className="mt-1 text-[17px] figure tabular">{format(parseDay(e.date), 'd')}</span>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13.5px]">{e.title}</div>
                  <div className="text-[12px] text-muted-foreground">{e.time} · {e.location ?? 'TBC'}</div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-[13px] text-muted-foreground">No exams scheduled.</p>
          )}
        </Panel>
        <Panel title="Study sessions · next 7 days" className="col-span-12 lg:col-span-4" action={<button onClick={() => openDialog('session')} className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted" aria-label="New session"><Plus className="size-3.5" /></button>}>
          {sessions.map((s) => (
            <div key={s.id} className="flex items-start gap-3 py-2">
              <CheckCircle checked={s.done} onChange={(done) => toggleSession.mutate({ id: s.id, done })} />
              <div className="min-w-0 flex-1">
                <div className={cn('truncate text-[13.5px]', s.done && 'text-muted-foreground line-through')}>
                  {subjectName(s.subjectId)}
                  {s.title && <span className="text-muted-foreground"> — {s.title}</span>}
                </div>
                <div className="text-[12px] text-muted-foreground">
                  {relativeDay(s.date)} · {s.startTime} · {s.durationMin} min
                </div>
              </div>
            </div>
          ))}
          {!sessions.length && <p className="text-[13px] text-muted-foreground">No sessions planned.</p>}
        </Panel>
        <Panel title="Assignments" className="col-span-12 lg:col-span-4">
          {assignments.map((a) => (
            <div key={a.id} className="flex items-start gap-3 py-2">
              <CheckCircle checked={a.done} onChange={(done) => toggleAssignment.mutate({ id: a.id, done })} />
              <div className="min-w-0 flex-1">
                <div className={cn('truncate text-[13.5px]', a.done && 'text-muted-foreground line-through')}>{a.title}</div>
                <div className="text-[12px] text-muted-foreground">
                  {subjectName(a.subjectId)}
                  {a.dueDate && ` · ${relativeDay(a.dueDate)}`}
                </div>
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </Page>
  )
}
