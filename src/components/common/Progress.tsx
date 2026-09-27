import { cn } from '@/lib/utils'

export function ProgressBar({ value, className, tone = 'primary' }: { value: number; className?: string; tone?: 'primary' | 'muted' | 'warn' }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('h-1 w-full overflow-hidden rounded-full bg-track', className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700 ease-out-soft',
          tone === 'primary' && 'bg-primary',
          tone === 'muted' && 'bg-faint',
          tone === 'warn' && 'bg-destructive/80',
        )}
        style={{ width: `${v}%` }}
      />
    </div>
  )
}

export function ProgressRing({ value, size = 44, stroke = 3.5, className, children }: { value: number; size?: number; stroke?: number; className?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-track" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out-soft"
        />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center">{children}</div>}
    </div>
  )
}
