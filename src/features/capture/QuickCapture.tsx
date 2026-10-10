import { useEffect, useState } from 'react'
import { BookOpen, CircleCheck, FolderKanban, Lightbulb, Link2, NotebookPen, Target, type LucideIcon } from 'lucide-react'
import { useUI } from '@/app/ui-state'
import { useToast } from '@/app/toast'
import { Kbd } from '@/components/common/Kbd'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { createNote } from '@/db/repositories/notes'
import { createLink } from '@/db/repositories/startup'
import { createTask } from '@/db/repositories/tasks'
import { useDbMutation } from '@/hooks/data'
import { useSettings } from '@/hooks/useSettings'
import { dayOffset, relativeDay, today } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { LinkSelect } from '@/features/shared/LinkSelect'
import { useLinkTargets } from '@/features/shared/useLinkTargets'
import { sortCapture } from '@/providers/ai/smartCapture'

type Kind = 'task' | 'note' | 'idea' | 'link'

const KINDS: { id: Kind; label: string; icon: LucideIcon }[] = [
  { id: 'task', label: 'Task', icon: CircleCheck },
  { id: 'note', label: 'Note', icon: NotebookPen },
  { id: 'idea', label: 'Idea', icon: Lightbulb },
  { id: 'link', label: 'Link', icon: Link2 },
]

const URL_RE = /https?:\/\/\S+/i

/** Guess what the text is: a URL is a link, "idea:" is an idea, the rest are tasks. */
function detectKind(text: string): Kind | null {
  if (URL_RE.test(text)) return 'link'
  if (/^\s*(\w+\s)?idea:/i.test(text)) return 'idea'
  if (/^\s*note:/i.test(text)) return 'note'
  return null
}

interface Links {
  projectId: string | null
  subjectId: string | null
  goalId: string | null
}

async function capture(kind: Kind, text: string, links: Links, dueDate: string | null) {
  const clean = text.replace(/^\s*(note|idea):\s*/i, '').trim()
  const [first, ...rest] = clean.split('\n')
  switch (kind) {
    case 'task':
      await createTask({ title: first.trim(), description: rest.join('\n').trim() || null, dueDate, ...links })
      return 'Task added'
    case 'note':
    case 'idea': {
      const body = rest.join('\n').trim()
      await createNote({
        title: first.trim(),
        kind: kind === 'idea' ? 'idea' : 'note',
        folder: kind === 'idea' ? 'Ideas' : null,
        content: body ? body.split('\n').map((l) => `<p>${l.replace(/</g, '&lt;')}</p>`).join('') : '',
        contentText: body,
        ...links,
      })
      return kind === 'idea' ? 'Idea saved' : 'Note saved'
    }
    case 'link': {
      const url = clean.match(URL_RE)?.[0] ?? clean
      const title = clean.replace(url, '').trim() || new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '')
      await createLink({ title, url, collection: links.projectId ? 'project' : links.subjectId ? 'study' : 'resources', projectId: links.projectId, subjectId: links.subjectId })
      return 'Link saved'
    }
  }
}

/** ⌘⇧Space — get it out of your head in two seconds. */
export function QuickCapture() {
  const { captureOpen, setCaptureOpen } = useUI()
  const toast = useToast()
  const targets = useLinkTargets()
  const [text, setText] = useState('')
  const [kind, setKind] = useState<Kind>('task')
  const [kindTouched, setKindTouched] = useState(false)
  const [links, setLinks] = useState<Links>({ projectId: null, subjectId: null, goalId: null })
  const [due, setDue] = useState<string | null>(null)
  const { aiApiKey } = useSettings()
  // With an API key, the first ↵ lets the AI sort the capture and the second one saves it.
  const [sorting, setSorting] = useState(false)
  const [sorted, setSorted] = useState(false)
  const save = useDbMutation(() => capture(kind, text, links, due))

  useEffect(() => {
    if (!captureOpen) {
      setText('')
      setKind('task')
      setKindTouched(false)
      setLinks({ projectId: null, subjectId: null, goalId: null })
      setDue(null)
      setSorting(false)
      setSorted(false)
    }
  }, [captureOpen])

  useEffect(() => {
    if (kindTouched) return
    setKind(detectKind(text) ?? 'task')
  }, [text, kindTouched])

  const sort = async () => {
    setSorting(true)
    try {
      const out = await sortCapture(aiApiKey, text, targets)
      setKind(out.kind)
      setKindTouched(true)
      // A link keeps its URL on the title line; any other kind keeps it in the details.
      setText(out.kind === 'link' && out.url ? `${out.title} ${out.url}` : [out.title, out.body, out.url].filter(Boolean).join('\n'))
      setLinks({ projectId: out.projectId, subjectId: out.subjectId, goalId: out.goalId })
      setDue(out.dueDate)
    } catch (error) {
      toast(`${error instanceof Error ? error.message : 'The AI could not sort this.'} Press ↵ to save it as it is.`)
    } finally {
      setSorting(false)
      setSorted(true)
    }
  }

  const submit = (skipSort = false) => {
    if (!text.trim() || save.isPending || sorting) return
    if (aiApiKey && !sorted && !skipSort) {
      void sort()
      return
    }
    save.mutate(undefined, {
      onSuccess: (msg) => {
        setCaptureOpen(false)
        toast(msg)
      },
    })
  }

  return (
    <Dialog open={captureOpen} onOpenChange={setCaptureOpen}>
      <DialogContent showCloseButton={false} className="top-[20%] translate-y-0 gap-0 p-0 shadow-float sm:max-w-[560px]">
        <DialogTitle className="sr-only">Quick capture</DialogTitle>
        <div className="px-5 pt-5">
          <textarea
            autoFocus
            value={text}
            rows={2}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                // ⌘↵ saves straight away, without the AI.
                submit(e.metaKey || e.ctrlKey)
              }
              // ⌘1–4 switches type without leaving the keyboard.
              if ((e.metaKey || e.ctrlKey) && ['1', '2', '3', '4'].includes(e.key)) {
                e.preventDefault()
                setKind(KINDS[Number(e.key) - 1].id)
                setKindTouched(true)
              }
            }}
            placeholder="What do you want to capture?"
            className="w-full resize-none bg-transparent text-[17px] leading-relaxed tracking-[-0.01em] outline-none placeholder:text-faint"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 px-5 pt-2 pb-4">
          {KINDS.map((k, i) => (
            <button
              key={k.id}
              onClick={() => {
                setKind(k.id)
                setKindTouched(true)
              }}
              title={`⌘${i + 1}`}
              className={cn(
                'flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] transition-colors',
                kind === k.id ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <k.icon className="size-3.5" strokeWidth={1.75} />
              {k.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-5 py-3">
          <span className="mr-1 text-[12px] text-muted-foreground">Belongs to</span>
          <LinkSelect icon={FolderKanban} placeholder="Project" value={links.projectId} options={targets.projects} onChange={(v) => setLinks({ ...links, projectId: v })} />
          <LinkSelect icon={BookOpen} placeholder="Subject" value={links.subjectId} options={targets.subjects} onChange={(v) => setLinks({ ...links, subjectId: v })} />
          {kind !== 'link' && <LinkSelect icon={Target} placeholder="Goal" value={links.goalId} options={targets.goals} onChange={(v) => setLinks({ ...links, goalId: v })} />}
          {kind === 'task' && (
            <div className="ml-auto flex gap-1">
              {[
                { label: 'Today', v: today() },
                { label: 'Tomorrow', v: dayOffset(1) },
                // A date the AI picked that is neither of the two above.
                ...(due && due !== today() && due !== dayOffset(1) ? [{ label: relativeDay(due), v: due }] : []),
              ].map((o) => (
                <button
                  key={o.label}
                  onClick={() => setDue(due === o.v ? null : o.v)}
                  className={cn('h-7 rounded-full px-2.5 text-[12.5px] transition-colors', due === o.v ? 'bg-primary-soft text-primary' : 'text-muted-foreground hover:text-foreground')}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between rounded-b-xl border-t border-border bg-muted/40 px-5 py-2.5">
          <span className="flex items-center gap-3 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1"><Kbd>↵</Kbd> {sorting ? 'sorting…' : aiApiKey && !sorted ? 'sort' : 'save'}</span>
            {aiApiKey && !sorted && <span className="flex items-center gap-1"><Kbd>⌘↵</Kbd> save as is</span>}
            <span className="flex items-center gap-1"><Kbd>⇧↵</Kbd> new line</span>
            <span className="flex items-center gap-1"><Kbd>⌘1–4</Kbd> type</span>
          </span>
          <Button size="sm" onClick={() => submit()} disabled={!text.trim() || sorting}>
            {sorting ? 'Sorting…' : aiApiKey && !sorted ? 'Sort' : 'Capture'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
