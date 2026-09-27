import { useMemo, useState } from 'react'
import { Check, Link2, Play, Trash2 } from 'lucide-react'
import { useToast } from '@/app/toast'
import { Card, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { InlineText } from '@/components/common/InlineText'
import { Button } from '@/components/ui/button'
import type { VideoWithStats } from '@/db/repositories/health'
import { relativeDay, today } from '@/lib/dates'
import { openExternal } from '@/lib/open'
import { cn } from '@/lib/utils'
import { FOCUS, guessFocus, guessMinutes, youTubeId, youTubeInfo, youTubeThumb } from '@/lib/youtube'
import { useLinkTargets } from '@/features/shared/useLinkTargets'
import { useHabits, useHealthActions, useVideos } from './hooks'

const focusLabel = (id: string | null) => FOCUS.find((f) => f.id === id)?.label ?? 'Pilates'

/** Log a video as today's workout (and tick the workout habit). */
function useDoVideo() {
  const { createWorkout } = useHealthActions()
  const { data: habits = [] } = useHabits()
  const { goals } = useLinkTargets()
  const toast = useToast()
  const habit = habits.find((h) => /workout|pilates|gym|train/i.test(h.name))
  const goal = goals.find((g) => /train|pilates|workout/i.test(g.name))
  return (v: VideoWithStats) =>
    createWorkout.mutate(
      {
        date: today(),
        title: v.title,
        kind: 'pilates',
        durationMin: v.durationMin ?? 30,
        videoId: v.id,
        habitId: habit?.id ?? null,
        goalId: goal?.id ?? null,
        exercises: [],
      },
      { onSuccess: () => toast('Workout logged — well done') },
    )
}

function Thumb({ video, className }: { video: VideoWithStats; className?: string }) {
  return (
    <button onClick={() => void openExternal(video.url)} className={cn('group/thumb relative block aspect-video w-full overflow-hidden bg-muted', className)} aria-label={`Play ${video.title} on YouTube`}>
      {video.youtubeId && <img src={youTubeThumb(video.youtubeId)} alt="" className="size-full object-cover transition-transform duration-500 group-hover/thumb:scale-[1.03]" />}
      <span className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover/thumb:bg-black/25">
        <span className="grid size-11 place-items-center rounded-full bg-white/95 text-black opacity-0 shadow-float transition-opacity group-hover/thumb:opacity-100">
          <Play className="size-4 translate-x-[1px]" fill="currentColor" strokeWidth={0} />
        </span>
      </span>
      {video.durationMin && <span className="absolute right-2 bottom-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white tabular">{video.durationMin} min</span>}
    </button>
  )
}

/** Health overview card: the video you did least recently. */
export function TodaysPilates() {
  const { data: videos = [] } = useVideos()
  const doVideo = useDoVideo()
  const pick = useMemo(() => [...videos].sort((a, b) => (a.lastDone ?? '').localeCompare(b.lastDone ?? ''))[0], [videos])
  if (!pick) return null
  const doneToday = pick.lastDone === today()
  return (
    <Card className="overflow-hidden">
      <Thumb video={pick} />
      <div className="p-5">
        <CardHeader title="Today’s pilates" action={<span className="text-[12px] text-muted-foreground">{focusLabel(pick.focus)}</span>} />
        <div className="mt-2 line-clamp-2 text-[14px] leading-snug">{pick.title}</div>
        <div className="mt-1 text-[12px] text-muted-foreground">
          {pick.channel}
          {pick.lastDone ? ` · last done ${relativeDay(pick.lastDone).toLowerCase()}` : ' · not done yet'}
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void openExternal(pick.url)}>
            <Play /> Play
          </Button>
          <Button size="sm" onClick={() => doVideo(pick)} disabled={doneToday}>
            <Check /> {doneToday ? 'Done today' : 'Done'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

/** Saved YouTube pilates videos: add by link, filter by focus, log with one click. */
export function PilatesLibrary() {
  const { data: videos = [] } = useVideos()
  const { addVideo, updateVideo, deleteVideo } = useHealthActions()
  const doVideo = useDoVideo()
  const toast = useToast()
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [focus, setFocus] = useState<string | null>(null)

  const add = async () => {
    const id = youTubeId(url)
    if (!id) {
      toast('That doesn’t look like a YouTube link')
      return
    }
    if (videos.some((v) => v.youtubeId === id)) {
      toast('Already in your library')
      return
    }
    setBusy(true)
    const info = await youTubeInfo(url)
    const title = info?.title ?? 'YouTube video'
    addVideo.mutate(
      { url: url.trim(), youtubeId: id, title, channel: info?.channel ?? null, durationMin: guessMinutes(title), focus: guessFocus(title) },
      { onSuccess: () => toast('Video added'), onSettled: () => setBusy(false) },
    )
    setUrl('')
  }

  const present = FOCUS.filter((f) => videos.some((v) => v.focus === f.id))
  const shown = focus ? videos.filter((v) => v.focus === focus) : videos

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5">
        <form
          className="flex items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            void add()
          }}
        >
          <Link2 className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a YouTube link — title, channel and length fill in by themselves"
            className="h-9 flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint"
          />
          <Button type="submit" disabled={!url.trim() || busy}>
            {busy ? 'Adding…' : 'Add video'}
          </Button>
        </form>
      </Card>

      {videos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[{ id: null, label: `All · ${videos.length}` }, ...present.map((f) => ({ id: f.id as string | null, label: f.label }))].map((f) => (
            <button
              key={f.label}
              onClick={() => setFocus(f.id)}
              className={cn('h-7 rounded-full px-3 text-[12.5px] transition-colors', focus === f.id ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {shown.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((v) => (
            <Card key={v.id} className="group/video flex flex-col overflow-hidden">
              <Thumb video={v} />
              <div className="flex flex-1 flex-col p-4">
                <div className="line-clamp-2 text-[14px] leading-snug font-medium">{v.title}</div>
                <div className="mt-1 text-[12px] text-muted-foreground">{v.channel}</div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px]">
                  <select
                    value={v.focus ?? ''}
                    onChange={(e) => updateVideo.mutate({ id: v.id, patch: { focus: e.target.value || null } })}
                    className="h-6 rounded-full bg-muted px-2 text-[12px] text-muted-foreground outline-none"
                    aria-label="Focus"
                  >
                    <option value="">Pilates</option>
                    {FOCUS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                    <InlineText
                      value={v.durationMin ? String(v.durationMin) : ''}
                      placeholder="?"
                      onSave={(val) => updateVideo.mutate({ id: v.id, patch: { durationMin: Number(val) || null } })}
                      className="w-6 text-right text-[12px] tabular"
                    />
                    min
                  </span>
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="text-[12px] text-muted-foreground">
                    {v.timesDone ? `Done ${v.timesDone}× · ${relativeDay(v.lastDone!).toLowerCase()}` : 'Not done yet'}
                  </span>
                  <span className="flex items-center gap-1">
                    <button onClick={() => deleteVideo.mutate(v.id)} className="grid size-7 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover/video:opacity-100 hover:bg-muted" aria-label="Remove video">
                      <Trash2 className="size-3.5" />
                    </button>
                    <Button size="sm" onClick={() => doVideo(v)} disabled={v.lastDone === today()}>
                      <Check /> {v.lastDone === today() ? 'Done today' : 'Done'}
                    </Button>
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={Play} title="Your pilates library is empty." description="Paste the link of a YouTube video you follow. It keeps the title, channel and length, and logs the workout when you tap Done." />
        </Card>
      )}
    </div>
  )
}
