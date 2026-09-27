import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { formatDistanceToNowStrict } from 'date-fns'
import { NotebookPen, Plus } from 'lucide-react'
import { Card, Panel } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { useNotes } from '@/features/notes/hooks'
import { useSetSetting, useSettings } from '@/hooks/useSettings'

export function RecentNotesWidget() {
  const { data: notes = [] } = useNotes({ limit: 5 })
  return (
    <Panel
      title="Recent notes"
      href="/notes"
      action={
        <Link to="/notes/new" className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="New note">
          <Plus className="size-3.5" />
        </Link>
      }
    >
      {notes.length ? (
        <div className="flex flex-col">
          {notes.map((n) => (
            <Link key={n.id} to={`/notes/${n.id}`} className="-mx-2 rounded-lg px-2 py-2 hover:bg-muted/70">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[13.5px]">{n.title || 'Untitled'}</span>
                <span className="shrink-0 text-[11.5px] text-faint">{formatDistanceToNowStrict(new Date(n.updatedAt))}</span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted-foreground">{n.contentText || 'Empty note'}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState compact icon={NotebookPen} title="No notes yet." />
      )}
    </Panel>
  )
}

/** A scratchpad that saves itself. Stored in settings, not as a note. */
export function QuickNotesWidget() {
  const { quickNotes } = useSettings()
  const setSetting = useSetSetting()
  const [value, setValue] = useState(quickNotes)
  const [saved, setSaved] = useState(true)
  const timer = useRef<number>(undefined)
  const dirty = useRef(false)

  useEffect(() => {
    if (!dirty.current) setValue(quickNotes)
  }, [quickNotes])

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center justify-between">
        <span className="label-caps">Quick notes</span>
        <span className="text-[11px] text-faint">{saved ? 'Saved' : 'Saving…'}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => {
          dirty.current = true
          setValue(e.target.value)
          setSaved(false)
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => {
            setSetting.mutate({ key: 'quickNotes', value: e.target.value }, { onSuccess: () => { setSaved(true); dirty.current = false } })
          }, 600)
        }}
        placeholder="Jot something down…"
        className="mt-3 min-h-[150px] flex-1 resize-none bg-transparent text-[13.5px] leading-[1.7] outline-none placeholder:text-faint"
      />
    </Card>
  )
}
