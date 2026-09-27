import { useState } from 'react'
import { ArrowUpRight, ChartLine, Code2, CreditCard, Folder, Globe, Link2, PenTool, Plus, X, type LucideIcon } from 'lucide-react'
import { Panel } from '@/components/common/Card'
import { useLinks, useStartupActions } from '@/features/startup/hooks'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = { globe: Globe, github: Code2, figma: PenTool, chart: ChartLine, card: CreditCard, folder: Folder }

function iconFor(icon: string | null, url: string): LucideIcon {
  if (icon && ICONS[icon]) return ICONS[icon]
  if (/github/.test(url)) return Code2
  if (/figma/.test(url)) return PenTool
  if (/stripe/.test(url)) return CreditCard
  if (/drive|dropbox/.test(url)) return Folder
  return Link2
}

/** Editable bookmarks for a collection, project or subject. */
export function LinksPanel({
  title = 'Links',
  filter,
  layout = 'list',
}: {
  title?: string
  filter: { collection?: string; projectId?: string; subjectId?: string }
  layout?: 'list' | 'grid'
}) {
  const { data: links = [] } = useLinks(filter)
  const { createLink, deleteLink } = useStartupActions()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [editing, setEditing] = useState(false)

  const submit = () => {
    if (!url.trim()) return
    const full = /^https?:\/\//.test(url) ? url.trim() : `https://${url.trim()}`
    createLink.mutate({
      title: name.trim() || new URL(full).hostname.replace(/^www\./, ''),
      url: full,
      collection: filter.collection ?? (filter.projectId ? 'project' : 'study'),
      projectId: filter.projectId ?? null,
      subjectId: filter.subjectId ?? null,
    })
    setName('')
    setUrl('')
    setAdding(false)
  }

  return (
    <Panel
      title={title}
      action={
        <div className="flex items-center gap-1">
          {links.length > 0 && (
            <button onClick={() => setEditing((e) => !e)} className="h-6 rounded-md px-2 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground">
              {editing ? 'Done' : 'Edit'}
            </button>
          )}
          <button onClick={() => setAdding((a) => !a)} className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Add link">
            <Plus className="size-3.5" />
          </button>
        </div>
      }
    >
      {adding && (
        <form
          className="mb-3 flex flex-col gap-2 rounded-xl border border-border p-2.5"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="bg-transparent text-[13px] outline-none placeholder:text-faint" />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" className="bg-transparent text-[13px] outline-none placeholder:text-faint" />
          <button type="submit" className="sr-only">Add</button>
        </form>
      )}
      {links.length === 0 && !adding ? (
        <p className="text-[13px] text-muted-foreground">No links yet.</p>
      ) : (
        <div className={cn(layout === 'grid' ? 'grid grid-cols-2 gap-2 sm:grid-cols-3' : 'flex flex-col')}>
          {links.map((l) => {
            const Icon = iconFor(l.icon, l.url)
            return (
              <div key={l.id} className="group/link relative">
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    'flex items-center gap-3 transition-colors',
                    layout === 'grid' ? 'rounded-xl border border-border p-3 hover:border-border-strong hover:bg-muted/40' : '-mx-2 rounded-lg px-2 py-2 hover:bg-muted/60',
                  )}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-3.5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">{l.title}</span>
                    {layout === 'list' && <span className="block truncate text-[11.5px] text-faint">{l.url.replace(/^https?:\/\//, '')}</span>}
                  </span>
                  {!editing && <ArrowUpRight className="size-3.5 text-faint opacity-0 transition-opacity group-hover/link:opacity-100" />}
                </a>
                {editing && (
                  <button onClick={() => deleteLink.mutate(l.id)} className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-card text-muted-foreground shadow-card hover:text-destructive" aria-label={`Remove ${l.title}`}>
                    <X className="size-3" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Panel>
  )
}
