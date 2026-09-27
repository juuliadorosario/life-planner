import type { ReactNode } from 'react'

export interface TooltipRow {
  label: string
  value: string
  /** CSS colour of the short line key. */
  color: string
}

/** Floating readout: value first (strong), series name second, line keys. */
/** `x` is a CSS length (px number or calc string) relative to the chart box. */
export function ChartTooltip({ x, y, title, rows }: { x: number | string; y: number; title: ReactNode; rows: TooltipRow[] }) {
  return (
    <div
      className="pointer-events-none absolute z-20 min-w-[140px] -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover px-3 py-2 shadow-float"
      style={{ left: x, top: y - 10 }}
    >
      <div className="mb-1 text-[11px] text-muted-foreground">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-[12px]">
          <span className="h-[2px] w-2.5 rounded-full" style={{ background: r.color }} />
          <span className="font-medium text-foreground tabular">{r.value}</span>
          <span className="text-muted-foreground">{r.label}</span>
        </div>
      ))}
    </div>
  )
}

/** Round a max up to a friendly axis ceiling and return ~3 ticks. */
export function niceTicks(max: number, count = 3): number[] {
  if (max <= 0) return [0]
  const raw = max / count
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw
  return Array.from({ length: count + 1 }, (_, i) => i * step)
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-[12px] text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}
