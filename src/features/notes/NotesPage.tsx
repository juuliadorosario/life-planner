import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { ArrowUpRight, BookOpen, FileText, FolderKanban, Lightbulb, Link2, NotebookPen, Pin, Plus, Search, Target, Trash2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { Kbd } from '@/components/common/Kbd'
import { Button } from '@/components/ui/button'
import { findNoteByTitle } from '@/db/repositories/notes'
import { cn } from '@/lib/utils'
import type { Note } from '@/types/domain'
import { LinkSelect } from '@/features/shared/LinkSelect'
import { useLinkTargets } from '@/features/shared/useLinkTargets'
import { useTasks } from '@/features/tasks/hooks'
import { TaskRow } from '@/features/tasks/TaskRow'
import { useBacklinks, useNoteActions, useNotes } from './hooks'
import { NoteEditor } from './NoteEditor'

const WIKILINK = /\[\[([^\]]+)\]\]/g

function NoteList({ notes, activeId }: { notes: Note[]; activeId?: string }) {
  const [query, setQuery] = useState('')
  const [folder, setFolder] = useState<string | null>(null)
  const folders = useMemo(() => [...new Set(notes.map((n) => n.folder).filter(Boolean))] as string[], [notes])
  const q = query.trim().toLowerCase()
  const shown = notes.filter(
    (n) => (!folder || n.folder === folder) && (!q || n.title.toLowerCase().includes(q) || n.contentText.toLowerCase().includes(q) || n.tags.some((t) => t.includes(q))),
  )

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-r border-border bg-sidebar/40">
      <div className="flex items-center justify-between px-5 pt-8 pb-3">
        <h1 className="text-[18px] font-semibold tracking-[-0.015em]">Notes</h1>
        <Button asChild size="icon-sm" variant="ghost" aria-label="New note">
          <Link to="/notes/new">
            <Plus />
          </Link>
        </Button>
      </div>
      <div className="px-4">
        <label className="flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-muted-foreground focus-within:border-primary/40">
          <Search className="size-3.5" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes" className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground" />
        </label>
        <div className="mt-3 flex flex-wrap gap-1">
          {[null, ...folders].map((f) => (
            <button
              key={f ?? 'all'}
              onClick={() => setFolder(f)}
              className={cn('h-6 rounded-full px-2.5 text-[12px] transition-colors', folder === f ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
            >
              {f ?? 'All'}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex-1 overflow-y-auto px-2.5 pb-6">
        {shown.map((n) => (
          <Link
            key={n.id}
            to={`/notes/${n.id}`}
            className={cn('mb-0.5 block rounded-lg px-3 py-2.5 transition-colors', n.id === activeId ? 'bg-card shadow-card ring-1 ring-border' : 'hover:bg-muted/70')}
          >
            <div className="flex items-center gap-1.5">
              {n.pinned && <Pin className="size-3 shrink-0 text-primary" />}
              {n.kind === 'idea' && <Lightbulb className="size-3 shrink-0 text-cat-school" />}
              <span className="truncate text-[13.5px] font-medium">{n.title || 'Untitled'}</span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">{n.contentText || 'Empty note'}</p>
            <div className="mt-1 text-[11px] text-faint">
              {formatDistanceToNowStrict(new Date(n.updatedAt), { addSuffix: true })}
              {n.folder && ` · ${n.folder}`}
            </div>
          </Link>
        ))}
        {!shown.length && <p className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">No notes match.</p>}
      </div>
    </aside>
  )
}

function RelatedPanel({ note, onPatch }: { note: Note; onPatch: (patch: Partial<Note>) => void }) {
  const targets = useLinkTargets()
  const { data: backlinks = [] } = useBacklinks({ id: note.id, title: note.title })
  const scopedFilter = note.examId ? { examId: note.examId } : note.projectId ? { projectId: note.projectId } : note.subjectId ? { subjectId: note.subjectId } : note.goalId ? { goalId: note.goalId } : null
  const { data: tasks = [] } = useTasks(scopedFilter ?? { projectId: '__none__' })
  const navigate = useNavigate()
  const outgoing = [...new Set([...note.contentText.matchAll(WIKILINK)].map((m) => m[1]))]
  const [tagDraft, setTagDraft] = useState('')

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col gap-7 overflow-y-auto border-l border-border px-5 pt-8 pb-10 xl:flex">
      <section>
        <CardHeader title="Belongs to" />
        <div className="mt-2 flex flex-col items-start gap-1.5">
          <LinkSelect icon={FolderKanban} placeholder="Project" value={note.projectId} options={targets.projects} onChange={(v) => onPatch({ projectId: v })} />
          <LinkSelect icon={BookOpen} placeholder="Subject" value={note.subjectId} options={targets.subjects} onChange={(v) => onPatch({ subjectId: v })} />
          <LinkSelect icon={FileText} placeholder="Exam" value={note.examId} options={targets.exams} onChange={(v) => onPatch({ examId: v })} />
          <LinkSelect icon={Target} placeholder="Goal" value={note.goalId} options={targets.goals} onChange={(v) => onPatch({ goalId: v })} />
        </div>
      </section>

      <section>
        <CardHeader title="Tags" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {note.tags.map((t) => (
            <button key={t} onClick={() => onPatch({ tags: note.tags.filter((x) => x !== t) })} className="h-6 rounded-full bg-muted px-2.5 text-[12px] text-muted-foreground hover:line-through" title="Remove tag">
              #{t}
            </button>
          ))}
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && tagDraft.trim()) {
                const tag = tagDraft.trim().replace(/^#/, '').toLowerCase()
                if (!note.tags.includes(tag)) onPatch({ tags: [...note.tags, tag] })
                setTagDraft('')
              }
            }}
            placeholder="+ tag"
            className="h-6 w-16 bg-transparent text-[12px] outline-none placeholder:text-faint"
          />
        </div>
      </section>

      {outgoing.length > 0 && (
        <section>
          <CardHeader title="Links" />
          <div className="mt-1.5 flex flex-col">
            {outgoing.map((title) => (
              <button
                key={title}
                onClick={async () => {
                  const target = await findNoteByTitle(title)
                  navigate(target ? `/notes/${target.id}` : '/notes')
                }}
                className="-mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-muted"
              >
                <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <CardHeader title="Backlinks" />
        {backlinks.length ? (
          <div className="mt-1.5 flex flex-col">
            {backlinks.map((b) => (
              <Link key={b.id} to={`/notes/${b.id}`} className="-mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-muted">
                <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{b.title}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">No notes link here yet. Write [[{note.title || 'Title'}]] in another note.</p>
        )}
      </section>

      {scopedFilter && tasks.length > 0 && (
        <section>
          <CardHeader title="Related tasks" />
          <div className="mt-1">
            {tasks.slice(0, 6).map((t) => (
              <TaskRow key={t.id} task={t} dense />
            ))}
          </div>
        </section>
      )}

      <section className="text-[11.5px] leading-relaxed text-faint">
        Created {format(new Date(note.createdAt), 'MMM d, yyyy')}
        <br />
        Edited {format(new Date(note.updatedAt), "MMM d, yyyy 'at' HH:mm")}
      </section>
    </aside>
  )
}

function NoteView({ note }: { note: Note }) {
  const { update, remove } = useNoteActions()
  const navigate = useNavigate()
  const [title, setTitle] = useState(note.title)
  const [status, setStatus] = useState<'saved' | 'saving'>('saved')
  const pending = useRef<Partial<Note>>({})
  const timer = useRef<number>(undefined)

  const flush = () => {
    window.clearTimeout(timer.current)
    const patch = pending.current
    pending.current = {}
    if (Object.keys(patch).length) update.mutate({ id: note.id, patch }, { onSuccess: () => setStatus('saved') })
  }
  const queue = (patch: Partial<Note>) => {
    pending.current = { ...pending.current, ...patch }
    setStatus('saving')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, 500)
  }
  // Save whatever is pending when leaving the note.
  useEffect(() => () => flush(), []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-10 pt-10 pb-32">
          <div className="mb-6 flex items-center justify-between text-[12px] text-muted-foreground">
            <span className="flex items-center gap-2">
              {note.folder ?? 'Notes'}
              <span className="text-faint">·</span>
              <span className="text-faint">{status === 'saving' ? 'Saving…' : 'Saved'}</span>
            </span>
            <span className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => update.mutate({ id: note.id, patch: { pinned: !note.pinned } })} aria-label={note.pinned ? 'Unpin' : 'Pin'}>
                <Pin className={cn(note.pinned && 'fill-primary text-primary')} />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => remove.mutate(note.id, { onSuccess: () => navigate('/notes') })} aria-label="Delete note">
                <Trash2 />
              </Button>
            </span>
          </div>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              queue({ title: e.target.value })
            }}
            placeholder="Untitled"
            className="w-full bg-transparent text-[30px] leading-tight font-semibold tracking-[-0.025em] outline-none placeholder:text-faint"
          />
          <div className="mt-6">
            <NoteEditor content={note.content} onChange={(html, text) => queue({ content: html, contentText: text })} />
          </div>
        </div>
      </div>
      <RelatedPanel note={note} onPatch={(patch) => update.mutate({ id: note.id, patch })} />
    </>
  )
}

export function NotesPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: notes = [], isLoading } = useNotes()
  const { create } = useNoteActions()
  const creating = useRef(false)

  // /notes/new creates a note, then replaces the URL with its id.
  useEffect(() => {
    if (id !== 'new' || creating.current) return
    creating.current = true
    create.mutate({}, { onSuccess: (n) => navigate(`/notes/${n.id}`, { replace: true }), onSettled: () => (creating.current = false) })
  }, [id, create, navigate])

  const note = notes.find((n) => n.id === id)

  return (
    <div className="animate-page flex h-svh">
      <NoteList notes={notes} activeId={id} />
      {note ? (
        <NoteView key={note.id} note={note} />
      ) : (
        <div className="grid flex-1 place-items-center">
          {!isLoading && id !== 'new' && (
            <Card className="border-dashed bg-transparent px-10 shadow-none">
              <EmptyState
                icon={NotebookPen}
                title={notes.length ? 'Choose a note' : 'No notes yet'}
                description="Notes can belong to a subject, a project, an exam or a goal — and link to each other with [[Title]]."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link to="/notes/new">
                      <Plus /> New note <Kbd className="ml-1">N</Kbd>
                    </Link>
                  </Button>
                }
              />
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
