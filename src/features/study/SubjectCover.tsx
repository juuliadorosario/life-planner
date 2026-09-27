import { useSettings } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'

/** Cover colourways, chosen in Settings. Text is always white. */
export const COVER_STYLES: Record<string, { label: string; bg: string }> = {
  camel: { label: 'Camel', bg: '#b08968' },
  black: { label: 'Black', bg: '#141414' },
  stone: { label: 'Stone', bg: '#bdb8b1' },
  cream: { label: 'Cream', bg: '#e6dccd' },
  pink: { label: 'Pink', bg: '#f4dde1' },
}

export type CoverStyle = 'camel' | 'black' | 'stone' | 'cream' | 'pink'

/**
 * The default cover for a subject: one flat colour (no glow, no shadow), the subject's name in white
 * script and its number in the corner. Replaced by a photo if one is added.
 */
export function SubjectCover({ name, index, large }: { name: string; index: number; large?: boolean }) {
  const { coverStyle } = useSettings()
  const style = COVER_STYLES[coverStyle] ?? COVER_STYLES.black
  return (
    <div className="relative flex size-full items-center justify-center overflow-hidden" style={{ background: style.bg }}>
      <span className={cn('absolute top-3 left-4 font-mono tracking-[0.14em] text-white/80', large ? 'text-[12px]' : 'text-[10.5px]')}>
        Nº {String(index + 1).padStart(2, '0')}
      </span>
      <span className={cn('script relative px-4 text-center leading-none text-white', large ? 'text-[88px]' : 'text-[46px]')}>
        {name}
      </span>
    </div>
  )
}
