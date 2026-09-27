import { useState } from 'react'
import { ChartTooltip } from './ChartTooltip'

/**
 * Profit / loss per period around a zero line. Position carries the sign;
 * colour repeats it (above = primary, below = destructive).
 */
export function NetBars({ data, format, height = 160 }: { data: { label: string; value: number }[]; format: (v: number) => string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.value)))
  const hasNeg = data.some((d) => d.value < 0)
  const hasPos = data.some((d) => d.value > 0)
  const zero = hasNeg && hasPos ? 0.5 : hasNeg ? 0 : 1 // fraction of height above the zero line
  const plotH = height - 24
  return (
    <div className="relative" onPointerLeave={() => setHover(null)}>
      <div className="relative flex" style={{ height: plotH }}>
        <div className="pointer-events-none absolute inset-x-0 border-t border-border-strong" style={{ top: plotH * zero }} />
        {data.map((d, i) => {
          const h = (Math.abs(d.value) / maxAbs) * plotH * (hasNeg && hasPos ? 0.5 : 1)
          const pos = d.value >= 0
          return (
            <div key={d.label} className="relative flex-1" onPointerEnter={() => setHover(i)} tabIndex={0} onFocus={() => setHover(i)} aria-label={`${d.label}: ${format(d.value)}`}>
              <div className={`absolute inset-x-1 inset-y-0 rounded-md ${hover === i ? 'bg-muted/70' : ''}`} />
              <div
                className={`absolute left-1/2 w-[34%] max-w-7 -translate-x-1/2 transition-all duration-700 ease-out-soft ${pos ? 'rounded-t-[4px] bg-primary' : 'rounded-b-[4px] bg-destructive/80'}`}
                style={pos ? { bottom: plotH * (1 - zero), height: h } : { top: plotH * zero, height: h }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[11px] text-muted-foreground">{d.label}</span>
        ))}
      </div>
      {hover !== null && (
        <ChartTooltip
          x={`${((hover + 0.5) / data.length) * 100}%`}
          y={plotH * zero}
          title={data[hover].label}
          rows={[{ label: data[hover].value >= 0 ? 'profit' : 'loss', value: format(data[hover].value), color: data[hover].value >= 0 ? 'var(--primary)' : 'var(--destructive)' }]}
        />
      )}
    </div>
  )
}
