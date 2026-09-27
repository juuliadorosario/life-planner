import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/** One number, its label and the change since last month. */
export function MetricTile({ label, value, delta, invert, className }: { label: string; value: string; delta?: number | null; invert?: boolean; className?: string }) {
  const good = delta == null ? null : invert ? delta <= 0 : delta >= 0
  return (
    <div className={cn('min-w-0', className)}>
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-[22px] leading-none figure tabular">{value}</div>
      {delta != null && Number.isFinite(delta) && (
        <div className={cn('mt-1.5 flex items-center gap-0.5 text-[11.5px] tabular', good ? 'text-primary' : 'text-destructive/90')}>
          {delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {Math.abs(delta).toFixed(0)}%
        </div>
      )}
    </div>
  )
}

export function pctChange(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous === 0) return null
  return ((current - previous) / previous) * 100
}
