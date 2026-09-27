import { useMemo, useState } from 'react'
import { endOfDay, format, startOfDay } from 'date-fns'
import { Check, LayoutGrid, Plus, RotateCcw } from 'lucide-react'
import { InlineText } from '@/components/common/InlineText'
import { Page } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { useCalendarEvents } from '@/features/calendar/hooks'
import { PhotoSlot } from '@/features/photos/PhotoSlot'
import { PhotoStrip } from '@/features/photos/PhotoStrip'
import { SpotifyCard } from '@/features/spotify/SpotifyCard'
import { useExams } from '@/features/study/hooks'
import { useTasks } from '@/features/tasks/hooks'
import { useNow } from '@/hooks/useNow'
import { useSetSetting, useSettings } from '@/hooks/useSettings'
import { daysUntil, greeting } from '@/lib/dates'
import { AddWidgetDialog } from './AddWidgetDialog'
import { useWidgetActions, useWidgets } from './hooks'
import { WidgetGrid } from './WidgetGrid'

/** One calm sentence about the day, built from real data. */
function useDaySummary() {
  const range = useMemo(() => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }), [])
  const { data: events = [] } = useCalendarEvents(range)
  const { data: tasks = [] } = useTasks({ view: 'today' })
  const { data: exams = [] } = useExams({ upcomingOnly: true })
  const open = tasks.filter((t) => t.status !== 'done').length
  const upcoming = events.filter((e) => !e.allDay && e.end > new Date()).length
  const parts = [open ? `${open} ${open === 1 ? 'task' : 'tasks'} for today` : 'no tasks left today']
  if (upcoming) parts.push(`${upcoming} more ${upcoming === 1 ? 'event' : 'events'} on the calendar`)
  const next = exams[0]
  const d = next ? daysUntil(next.date) : Infinity
  const examLine = next && d <= 14 ? ` ${next.title.split(' — ')[0]} exam in ${d} ${d === 1 ? 'day' : 'days'}.` : ''
  return `You have ${parts.join(' and ')}.${examLine}`
}

/** The left column: a portrait, the book on the nightstand, what's playing. */
function Aside() {
  const { reading } = useSettings()
  const set = useSetSetting()
  return (
    <aside className="flex flex-col gap-8">
      <PhotoSlot slot="home.portrait" className="mx-auto aspect-square w-full max-w-[220px]" rounded="rounded-full" placeholder="Your photo" />
      <section>
        <div className="mb-3 label-caps">Currently reading</div>
        <div className="flex gap-4">
          <PhotoSlot slot="home.book" className="aspect-[2/3] w-[72px] shrink-0 shadow-card" rounded="rounded-[4px]" compact />
          <div className="min-w-0 pt-1">
            <InlineText value={reading.title} onSave={(v) => set.mutate({ key: 'reading', value: { ...reading, title: v } })} className="font-display text-[17px] leading-tight font-medium tracking-[-0.01em]" />
            <InlineText value={reading.author} onSave={(v) => set.mutate({ key: 'reading', value: { ...reading, author: v } })} className="mt-1 text-[12.5px] text-muted-foreground" />
          </div>
        </div>
      </section>
      <SpotifyCard />
    </aside>
  )
}

export function HomePage() {
  const now = useNow()
  const { userName, intention } = useSettings()
  const set = useSetSetting()
  const { data: widgets = [], isLoading } = useWidgets()
  const { reset } = useWidgetActions()
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const summary = useDaySummary()

  return (
    <Page wide className="pt-6">
      <PhotoStrip name="home" count={6} />

      <header className="mt-10 mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-3 label-caps">{format(now, 'EEEE, d MMMM')}</div>
          <h1 className="display text-[52px] leading-[1]">
            {greeting(now)}
            {userName && (
              <>
                ,<span className="script ml-3 text-[58px] text-muted-foreground">{userName}</span>
              </>
            )}
          </h1>
          <p className="mt-3 text-[14.5px] text-muted-foreground">{summary}</p>
        </div>
        <div className="flex items-center gap-2">
          {editing && (
            <>
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => reset.mutate()}>
                <RotateCcw /> Reset
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
                <Plus /> Add widget
              </Button>
            </>
          )}
          <Button variant={editing ? 'default' : 'ghost'} size="sm" className={editing ? '' : 'text-muted-foreground'} onClick={() => setEditing((e) => !e)}>
            {editing ? <Check /> : <LayoutGrid />}
            {editing ? 'Done' : 'Customize'}
          </Button>
        </div>
      </header>

      <div className="mb-8 flex items-center gap-3 rounded-lg bg-muted/70 px-4 py-3">
        <InlineText value={intention} onSave={(v) => set.mutate({ key: 'intention', value: v })} className="font-display text-[17px] font-light text-foreground/80" placeholder="An intention for this season…" />
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Aside />
        <div>
          {!isLoading && <WidgetGrid widgets={widgets} editing={editing} />}
          {!editing && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => {
                  setEditing(true)
                  setAdding(true)
                }}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Plus className="size-3.5" /> Add widget
              </button>
            </div>
          )}
        </div>
      </div>
      <AddWidgetDialog open={adding} onOpenChange={setAdding} widgets={widgets} />
    </Page>
  )
}
