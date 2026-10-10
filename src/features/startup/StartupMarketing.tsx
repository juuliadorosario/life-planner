import { useState } from 'react'
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { format, startOfMonth } from 'date-fns'
import { Plus, Trash2, X } from 'lucide-react'
import { Card, CardHeader } from '@/components/common/Card'
import { Sparkline } from '@/components/common/Sparkline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as repo from '@/db/repositories/marketing'
import type { MarketingPost, PostStatus } from '@/db/repositories/marketing'
import { useDbMutation, useDbQuery } from '@/hooks/data'
import { useSetSetting, useSettings } from '@/hooks/useSettings'
import { parseDay, relativeDay, toDay } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { Field, OptionSelect } from '@/features/shared/CreateDialogs'
import { NotesList } from '@/features/shared/NotesList'
import { useLiveNumbers } from './liveNumbers'
import { pctChange } from './MetricTile'

export const CHANNELS = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'web', name: 'Website' },
  { id: 'email', name: 'Email' },
]
const channelName = (id: string) => CHANNELS.find((c) => c.id === id)?.name ?? id

/** Audience numbers tracked per month. */
const STATS = [
  { id: 'instagram', label: 'Instagram', unit: 'followers' },
  { id: 'linkedin', label: 'LinkedIn', unit: 'followers' },
  { id: 'tiktok', label: 'TikTok', unit: 'followers' },
  { id: 'web', label: 'Website', unit: 'visits' },
  { id: 'leads', label: 'Leads', unit: 'contacts' },
]

const COLUMNS: { id: PostStatus; label: string; dot: string }[] = [
  { id: 'idea', label: 'Idea', dot: 'bg-faint' },
  { id: 'doing', label: 'In progress', dot: 'bg-cat-school' },
  { id: 'published', label: 'Published', dot: 'bg-primary' },
]

function useMarketing() {
  return {
    posts: useDbQuery(['marketing-posts'], repo.listPosts).data ?? [],
    stats: useDbQuery(['channel-stats'], repo.listChannelStats).data ?? [],
    createPost: useDbMutation(repo.createPost),
    updatePost: useDbMutation(({ id, patch }: { id: string; patch: Partial<MarketingPost> }) => repo.updatePost(id, patch)),
    deletePost: useDbMutation(repo.deletePost),
    upsertStat: useDbMutation(({ month, channel, value }: { month: string; channel: string; value: number }) => repo.upsertChannelStat(month, channel, value)),
  }
}

function ChannelNumbers() {
  const { stats, upsertStat } = useMarketing()
  const [logging, setLogging] = useState(false)
  const thisMonth = toDay(startOfMonth(new Date()))
  const [draft, setDraft] = useState<Record<string, string>>({})
  const { marketingLiveUrl } = useSettings()
  const setSetting = useSetSetting()
  const live = useLiveNumbers(marketingLiveUrl)
  const liveChannels = live.data?.channels ?? []
  const [connecting, setConnecting] = useState(false)
  const [link, setLink] = useState('')

  const series = (channel: string) => stats.filter((s) => s.channel === channel)
  return (
    <div>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-5">
        {STATS.map((st) => {
          const rows = series(st.id)
          const cur = rows.at(-1)
          const prev = rows.at(-2)
          const delta = cur ? pctChange(cur.value, prev?.value) : null
          return (
            <Card key={st.id} className="flex flex-col p-5">
              <div className="flex items-center justify-between">
                <span className="label-caps flex items-center gap-1.5">
                  {st.label}
                  {liveChannels.includes(st.id) && <span className="size-1.5 rounded-full bg-primary" title="Live" />}
                </span>
                {delta != null && Number.isFinite(delta) && (
                  <span className={cn('text-[11.5px] tabular', delta >= 0 ? 'text-primary' : 'text-destructive')}>
                    {delta >= 0 ? '+' : '−'}
                    {Math.abs(delta).toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="figure mt-3 text-[28px] leading-none tabular">{cur ? Math.round(cur.value).toLocaleString('en') : '—'}</div>
              <div className="mt-1 text-[11.5px] text-muted-foreground">{st.unit}</div>
              <div className="mt-auto pt-4">
                <Sparkline values={rows.map((r) => r.value)} height={34} />
              </div>
            </Card>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
        {connecting ? (
          <form
            className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-3"
            onSubmit={(e) => {
              e.preventDefault()
              setSetting.mutate({ key: 'marketingLiveUrl', value: link.trim() })
              setConnecting(false)
            }}
          >
            <Field label="Link that answers with your Website and Leads numbers">
              <Input type="url" className="w-80" placeholder="https://…" value={link} onChange={(e) => setLink(e.target.value)} autoFocus />
            </Field>
            <Button type="submit" size="sm">{link.trim() ? 'Connect' : 'Disconnect'}</Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setConnecting(false)} aria-label="Cancel"><X /></Button>
          </form>
        ) : (
          <button
            onClick={() => {
              setLink(marketingLiveUrl)
              setConnecting(true)
            }}
            className={cn('text-[12.5px] hover:text-foreground', live.isError ? 'text-destructive' : 'text-muted-foreground')}
          >
            {!marketingLiveUrl
              ? 'Connect live numbers'
              : live.isError
                ? `Live numbers: ${live.error.message}`
                : live.data
                  ? `Live · updated ${format(live.data.at, 'HH:mm')}`
                  : 'Live · connecting…'}
          </button>
        )}
        {logging ? (
          <form
            className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-3"
            onSubmit={(e) => {
              e.preventDefault()
              for (const st of STATS) {
                const v = draft[st.id]
                if (v !== undefined && v !== '') upsertStat.mutate({ month: thisMonth, channel: st.id, value: Number(v) })
              }
              setLogging(false)
              setDraft({})
            }}
          >
            <span className="self-center pr-1 text-[12.5px] text-muted-foreground">{format(new Date(), 'MMMM')}:</span>
            {STATS.map((st) => (
              <Field key={st.id} label={st.label}>
                <Input
                  type="number"
                  min={0}
                  className="w-24"
                  placeholder={String(stats.find((s) => s.channel === st.id && s.month === thisMonth)?.value ?? '')}
                  value={draft[st.id] ?? ''}
                  onChange={(e) => setDraft({ ...draft, [st.id]: e.target.value })}
                />
              </Field>
            ))}
            <Button type="submit" size="sm">Save</Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setLogging(false)} aria-label="Cancel"><X /></Button>
          </form>
        ) : (
          <button onClick={() => setLogging(true)} className="text-[12.5px] text-muted-foreground hover:text-foreground">
            Update this month’s numbers
          </button>
        )}
      </div>
    </div>
  )
}

function PostCard({ post }: { post: MarketingPost }) {
  const { deletePost } = useMarketing()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: post.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      {...listeners}
      className={cn('group/post cursor-grab rounded-lg border border-border bg-card p-3 shadow-card active:cursor-grabbing', isDragging && 'z-30 shadow-float')}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn('text-[13.5px] leading-snug', post.status === 'published' && 'text-muted-foreground')}>{post.title}</span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => deletePost.mutate(post.id)}
          className="opacity-0 transition-opacity group-hover/post:opacity-100"
          aria-label="Delete post"
        >
          <Trash2 className="size-3.5 text-muted-foreground" />
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11.5px] text-muted-foreground">
        <span className="rounded-md bg-muted px-1.5 py-0.5">{channelName(post.channel)}</span>
        {post.date && <span>{relativeDay(post.date)}</span>}
      </div>
    </div>
  )
}

function Column({ status, label, dot, posts }: { status: PostStatus; label: string; dot: string; posts: MarketingPost[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div ref={setNodeRef} className={cn('flex min-h-[260px] flex-col rounded-xl bg-muted/50 p-2.5 transition-colors', isOver && 'bg-primary-soft')}>
      <div className="flex items-center gap-2 px-1.5 pt-1 pb-3 text-[13px] font-medium">
        <span className={cn('size-2 rounded-full', dot)} />
        {label}
        <span className="font-normal text-muted-foreground tabular">{posts.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        {!posts.length && <div className="rounded-lg border border-dashed border-border-strong/70 py-6 text-center text-[12px] text-faint">Drop posts here</div>}
      </div>
    </div>
  )
}

function ContentBoard() {
  const { posts, createPost, updatePost } = useMarketing()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const [title, setTitle] = useState('')
  const [channel, setChannel] = useState<string | null>('instagram')
  const [date, setDate] = useState('')

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return
    const post = posts.find((p) => p.id === active.id)
    if (post && post.status !== over.id) updatePost.mutate({ id: post.id, patch: { status: over.id as PostStatus } })
  }

  return (
    <Card className="p-6">
      <CardHeader title="Content" action={<span className="text-[12px] text-muted-foreground">Drag to move · {posts.filter((p) => p.status === 'published').length} published</span>} />
      <form
        className="mt-4 mb-5 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return
          createPost.mutate({ title: title.trim(), channel: channel ?? 'instagram', date: date || null })
          setTitle('')
          setDate('')
        }}
      >
        <div className="min-w-[240px] flex-1">
          <Field label="New post">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reel: our product in 30 seconds" />
          </Field>
        </div>
        <div className="w-36">
          <Field label="Channel">
            <OptionSelect value={channel} onChange={setChannel} options={CHANNELS} placeholder="Channel" />
          </Field>
        </div>
        <div className="w-40">
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Button type="submit" disabled={!title.trim()}>
          <Plus /> Add
        </Button>
      </form>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((c) => (
            <Column key={c.id} status={c.id} label={c.label} dot={c.dot} posts={posts.filter((p) => p.status === c.id)} />
          ))}
        </div>
      </DndContext>
      {posts.some((p) => p.date && p.status !== 'published') && (
        <p className="mt-4 text-[12px] text-faint">
          Next up: {posts.filter((p) => p.date && p.status !== 'published' && p.date >= toDay()).slice(0, 1).map((p) => `${p.title} · ${format(parseDay(p.date!), 'EEE d MMM')}`)[0] ?? '—'}
        </p>
      )}
    </Card>
  )
}

/** Marketing: audience numbers, the content pipeline, and ideas. */
export function StartupMarketing() {
  return (
    <div className="flex flex-col gap-5">
      <ChannelNumbers />
      <ContentBoard />
      <NotesList title="Ideas" filter={{ folder: 'Marketing' }} defaults={{ folder: 'Marketing', kind: 'idea' }} />
    </div>
  )
}
