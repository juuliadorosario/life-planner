import { cn } from '@/lib/utils'
import { PhotoSlot } from './PhotoSlot'

/** The moodboard banner across the top of a page: a row of photos. */
export function PhotoStrip({ name, count = 6, className }: { name: string; count?: number; className?: string }) {
  return (
    <div className={cn('grid h-[168px] gap-1.5 overflow-hidden rounded-xl', className)} style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }, (_, i) => (
        <PhotoSlot key={i} slot={`${name}.banner.${i}`} rounded="rounded-none" compact={count > 6} />
      ))}
    </div>
  )
}
