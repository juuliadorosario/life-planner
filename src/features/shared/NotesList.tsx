import { Link, useNavigate } from 'react-router'
import { formatDistanceToNowStrict } from 'date-fns'
import { Plus } from 'lucide-react'
import { Panel } from '@/components/common/Card'
import { useNoteActions, useNotes } from '@/features/notes/hooks'
import type { NoteInput } from '@/db/repositories/notes'

/** Notes attached to an object, with a button to write a new one already linked. */
export function NotesList({ filter, defaults, title = 'Notes' }: { filter: Parameters<typeof useNotes>[0]; defaults: NoteInput; title?: string }) {
  const { data: notes = [] } = useNotes(filter)
  const { create } = useNoteActions()
  const navigate = useNavigate()
  return (
    <Panel
      title={title}
      action={
        <button onClick={() => create.mutate(defaults, { onSuccess: (n) => navigate(`/notes/${n.id}`) })} className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="New note">
          <Plus className="size-3.5" />
        </button>
      }
    >
      {notes.length ? (
        <div className="flex flex-col">
          {notes.map((n) => (
            <Link key={n.id} to={`/notes/${n.id}`} className="-mx-2 rounded-lg px-2 py-2 hover:bg-muted/60">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[13.5px]">{n.title || 'Untitled'}</span>
                <span className="shrink-0 text-[11.5px] text-faint">{formatDistanceToNowStrict(new Date(n.updatedAt))}</span>
              </div>
              <p className="line-clamp-1 text-[12.5px] text-muted-foreground">{n.contentText || 'Empty note'}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground">No notes yet.</p>
      )}
    </Panel>
  )
}
