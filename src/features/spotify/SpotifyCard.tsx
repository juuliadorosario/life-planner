import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AlbumArt } from './AlbumArt'
import { usePlayback } from './usePlayback'
import { personal } from '@/config/personal'

const SPOTIFY_GREEN = '#1ed760'

function mmss(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** The Spotify logo mark (three bars in a circle), drawn inline. */
function SpotifyMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="12" fill={SPOTIFY_GREEN} />
      <path d="M6.2 9.3c3.9-1.2 8.3-.8 11.6 1.1M6.8 12.3c3.2-.9 6.8-.6 9.6 1M7.4 15.1c2.5-.7 5.3-.5 7.5.8" stroke="#000" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/**
 * Now playing, dressed like Spotify's own player: dark card, big artwork,
 * white type, a progress bar that turns green on hover.
 */
export function SpotifyCard() {
  const { state, provider } = usePlayback()
  const track = state?.track
  const progress = track && track.durationMs ? (state.progressMs / track.durationMs) * 100 : 0

  return (
    <section className="rounded-xl bg-[#121212] p-3 text-white">
      <div className="mb-3 flex items-center gap-1.5 px-1 text-[11px] font-medium text-[#b3b3b3]">
        <SpotifyMark className="size-3.5" />
        {provider.id === 'mock' ? 'Spotify · demo' : state?.isPlaying ? 'Playing on this Mac' : 'Spotify'}
      </div>

      {track ? (
        <>
          <AlbumArt track={track} className="w-full rounded-md shadow-[0_8px_24px_rgb(0_0_0/0.5)]" />
          <div className="mt-3 px-1">
            <div className="truncate text-[14px] font-bold tracking-[-0.01em]">{track.title}</div>
            <div className="truncate text-[12.5px] text-[#b3b3b3]">{track.artist}</div>
          </div>

          <div className="group/bar mt-3 px-1">
            <div className="h-1 overflow-hidden rounded-full bg-[#4d4d4d]">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-1000 ease-linear group-hover/bar:bg-[#1ed760]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10.5px] text-[#a7a7a7] tabular">
              <span>{mmss(state.progressMs)}</span>
              <span>{mmss(track.durationMs)}</span>
            </div>
          </div>

          <div className="mt-1 flex items-center justify-center gap-5 pb-1">
            <button onClick={() => provider.previous()} className="text-[#b3b3b3] transition-colors hover:text-white" aria-label="Previous">
              <SkipBack className="size-[18px]" fill="currentColor" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => (state.isPlaying ? provider.pause() : provider.play())}
              className="grid size-9 place-items-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95"
              aria-label={state.isPlaying ? 'Pause' : 'Play'}
            >
              {state.isPlaying ? <Pause className="size-4" fill="currentColor" strokeWidth={0} /> : <Play className="size-4 translate-x-[1px]" fill="currentColor" strokeWidth={0} />}
            </button>
            <button onClick={() => provider.next()} className="text-[#b3b3b3] transition-colors hover:text-white" aria-label="Next">
              <SkipForward className="size-[18px]" fill="currentColor" strokeWidth={1.5} />
            </button>
          </div>
        </>
      ) : (
        <p className={cn('px-1 pb-1 text-[12.5px] leading-relaxed text-[#b3b3b3]')}>
          {state?.status === 'not-running'
            ? 'Open Spotify on your Mac to see what’s playing.'
            : state?.status === 'unavailable'
              ? `Allow ${personal.appName} to control Spotify in System Settings → Privacy & Security → Automation.`
              : 'Nothing playing right now.'}
        </p>
      )}
    </section>
  )
}
