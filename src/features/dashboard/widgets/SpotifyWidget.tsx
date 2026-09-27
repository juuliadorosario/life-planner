import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { AlbumArt } from '@/features/spotify/AlbumArt'
import { usePlayback } from '@/features/spotify/usePlayback'
import { personal } from '@/config/personal'

function mmss(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function SpotifyWidget() {
  const { state, provider } = usePlayback()
  const track = state?.track
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center justify-between">
        <span className="label-caps">Now playing</span>
        {provider.id === 'mock' && <span className="text-[11px] text-faint">Demo</span>}
      </div>
      {track ? (
        <>
          <div className="mt-4 flex items-center gap-4">
            <AlbumArt track={track} className="size-[72px] shrink-0 shadow-card" />
            <div className="min-w-0">
              <div className="truncate text-[14.5px] font-medium">{track.title}</div>
              <div className="truncate text-[13px] text-muted-foreground">{track.artist}</div>
            </div>
          </div>
          <div className="mt-5">
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground/70 transition-[width] duration-1000 ease-linear" style={{ width: `${(state.progressMs / track.durationMs) * 100}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground tabular">
              <span>{mmss(state.progressMs)}</span>
              <span>{mmss(track.durationMs)}</span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-3">
            <button onClick={() => provider.previous()} className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Previous">
              <SkipBack className="size-4" fill="currentColor" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => (state.isPlaying ? provider.pause() : provider.play())}
              className="grid size-10 place-items-center rounded-full bg-foreground text-background transition-transform active:scale-95"
              aria-label={state.isPlaying ? 'Pause' : 'Play'}
            >
              {state.isPlaying ? <Pause className="size-4" fill="currentColor" strokeWidth={0} /> : <Play className="size-4 translate-x-[1px]" fill="currentColor" strokeWidth={0} />}
            </button>
            <button onClick={() => provider.next()} className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Next">
              <SkipForward className="size-4" fill="currentColor" strokeWidth={1.5} />
            </button>
          </div>
        </>
      ) : (
        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
          {state?.status === 'not-running'
            ? 'Open Spotify on your Mac to see what’s playing.'
            : state?.status === 'unavailable'
              ? `Allow ${personal.appName} to control Spotify in System Settings → Privacy & Security → Automation.`
              : 'Nothing playing.'}
        </p>
      )}
    </Card>
  )
}
