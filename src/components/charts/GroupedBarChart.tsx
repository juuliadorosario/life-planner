import { useState } from 'react'
import { ChartTooltip, niceTicks } from './ChartTooltip'

export interface BarSeries {
  key: string
  label: string
  color: string
}

/**
 * Vertical bars grouped per category (e.g. month), one shared y-axis.
 * Hovering a group shows every series' value.
 */
export function GroupedBarChart<T extends Record<string, unknown>>({
  data,
  categoryKey,
  series,
  format,
  formatCategory = String,
  height = 220,
}: {
  data: T[]
  categoryKey: keyof T
  series: BarSeries[]
  format: (v: number) => string
  formatCategory?: (c: unknown) => string
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)))
  const ticks = niceTicks(max)
  const top = ticks.at(-1)!
  const plotH = height - 28

  return (
    <div className="relative" onPointerLeave={() => setHover(null)}>
      <div className="flex" style={{ height }}>
        {/* y-axis */}
        <div className="relative w-12 shrink-0" style={{ height: plotH }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-2 translate-y-1/2 text-[10.5px] text-faint tabular" style={{ bottom: `${(t / top) * 100}%` }}>
              {format(t)}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0" style={{ height: plotH }}>
            {ticks.map((t) => (
              <div key={t} className={t === 0 ? 'absolute inset-x-0 border-t border-border-strong' : 'absolute inset-x-0 border-t border-border/70'} style={{ bottom: `${(t / top) * 100}%` }} />
            ))}
          </div>
          <div className="absolute inset-0 flex">
            {data.map((d, i) => (
              <div
                key={i}
                className="group/col relative flex flex-1 flex-col items-center"
                onPointerEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                tabIndex={0}
                aria-label={`${formatCategory(d[categoryKey])}: ${series.map((s) => `${s.label} ${format(Number(d[s.key]) || 0)}`).join(', ')}`}
              >
                <div className={`absolute inset-x-1 top-0 rounded-md transition-colors ${hover === i ? 'bg-muted/70' : ''}`} style={{ height: plotH }} />
                <div className="relative flex w-full items-end justify-center gap-[2px]" style={{ height: plotH }}>
                  {series.map((s) => (
                    <div
                      key={s.key}
                      className="w-[30%] max-w-6 rounded-t-[4px] transition-[height] duration-700 ease-out-soft"
                      style={{ height: `${((Number(d[s.key]) || 0) / top) * 100}%`, background: s.color }}
                    />
                  ))}
                </div>
                <span className="mt-2 text-[11px] text-muted-foreground">{formatCategory(d[categoryKey])}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {hover !== null && (
        <ChartTooltip
          x={`calc(48px + (100% - 48px) * ${(hover + 0.5) / data.length})`}
          y={0}
          title={formatCategory(data[hover][categoryKey])}
          rows={series.map((s) => ({ label: s.label, value: format(Number(data[hover][s.key]) || 0), color: s.color }))}
        />
      )}
    </div>
  )
}
