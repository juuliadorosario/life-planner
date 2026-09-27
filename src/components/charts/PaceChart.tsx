import { useRef, useState } from 'react'
import { ChartTooltip, niceTicks } from './ChartTooltip'

/**
 * Cumulative spending through the month (solid line) against an even pace to
 * the budget (dashed guide). Above the guide = spending faster than planned.
 */
export function PaceChart({ daily, budget, daysInMonth, format, height = 190 }: { daily: number[]; budget: number; daysInMonth: number; format: (v: number) => string; height?: number }) {
  const box = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const cumulative = daily.reduce<number[]>((acc, v) => [...acc, (acc.at(-1) ?? 0) + v], [])
  const ticks = niceTicks(Math.max(budget, cumulative.at(-1) ?? 0, 1))
  const top = ticks.at(-1)!
  const plotH = height - 24
  const x = (day: number) => ((day - 1) / Math.max(1, daysInMonth - 1)) * 100
  const y = (v: number) => plotH - (v / top) * plotH
  const line = cumulative.map((v, i) => `${i ? 'L' : 'M'}${x(i + 1)},${y(v)}`).join(' ')
  const pace = (day: number) => (budget / daysInMonth) * day

  return (
    <div className="flex" style={{ height }}>
      <div className="relative w-12 shrink-0" style={{ height: plotH }}>
        {ticks.map((t) => (
          <span key={t} className="absolute right-2 translate-y-1/2 text-[10.5px] text-faint tabular" style={{ bottom: `${(t / top) * 100}%` }}>
            {format(t)}
          </span>
        ))}
      </div>
      <div
        ref={box}
        className="relative flex-1"
        onPointerMove={(e) => {
          const r = box.current!.getBoundingClientRect()
          const day = Math.round(((e.clientX - r.left) / r.width) * (daysInMonth - 1)) + 1
          setHover(Math.max(1, Math.min(cumulative.length, day)))
        }}
        onPointerLeave={() => setHover(null)}
      >
        <div className="absolute inset-x-0 top-0" style={{ height: plotH }}>
          {ticks.map((t) => (
            <div key={t} className={t === 0 ? 'absolute inset-x-0 border-t border-border-strong' : 'absolute inset-x-0 border-t border-border/70'} style={{ bottom: `${(t / top) * 100}%` }} />
          ))}
        </div>
        <svg viewBox={`0 0 100 ${plotH}`} preserveAspectRatio="none" className="absolute inset-x-0 top-0 w-full overflow-visible" style={{ height: plotH }} role="img" aria-label={`Spent ${format(cumulative.at(-1) ?? 0)} of ${format(budget)} budget`}>
          <path d={`M0,${y(pace(1))} L100,${y(pace(daysInMonth))}`} stroke="var(--faint)" strokeWidth="1.5" strokeDasharray="4 4" fill="none" vectorEffect="non-scaling-stroke" />
          <path d={line} stroke="var(--primary)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
        {hover !== null && (
          <>
            <div className="pointer-events-none absolute top-0 w-px bg-border-strong" style={{ left: `${x(hover)}%`, height: plotH }} />
            <div className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary" style={{ left: `${x(hover)}%`, top: y(cumulative[hover - 1]) }} />
            <ChartTooltip
              x={`${x(hover)}%`}
              y={y(cumulative[hover - 1])}
              title={`Day ${hover}`}
              rows={[
                { label: 'spent', value: format(cumulative[hover - 1]), color: 'var(--primary)' },
                { label: 'on pace', value: format(pace(hover)), color: 'var(--faint)' },
              ]}
            />
          </>
        )}
        <div className="absolute inset-x-0 flex justify-between text-[11px] text-muted-foreground" style={{ top: plotH + 8 }}>
          <span>1</span>
          <span>{Math.round(daysInMonth / 2)}</span>
          <span>{daysInMonth}</span>
        </div>
      </div>
    </div>
  )
}
