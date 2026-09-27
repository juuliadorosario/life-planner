import { cn } from '@/lib/utils'
import type { Track } from '@/providers/spotify'

/** Real artwork when available; otherwise a calm generated cover. */
export function AlbumArt({ track, className }: { track: Track; className?: string }) {
  if (track.artworkUrl) {
    return <img src={track.artworkUrl} alt="" className={cn('aspect-square rounded-xl object-cover', className)} />
  }
  const [a, b] = track.palette
  return (
    <div
      className={cn('relative aspect-square overflow-hidden rounded-xl', className)}
      style={{ background: `linear-gradient(145deg, ${a} 0%, ${b} 100%)` }}
      aria-hidden
    >
      <div className="absolute -right-1/4 -bottom-1/4 size-3/4 rounded-full opacity-35 mix-blend-soft-light" style={{ background: a }} />
      <div className="absolute top-[14%] left-[14%] size-[22%] rounded-full bg-white/25 mix-blend-soft-light" />
    </div>
  )
}
