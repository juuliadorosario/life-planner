import { useId, useRef, useState } from 'react'
import { ChartTooltip, niceTicks } from './ChartTooltip'

/** One series over time: 2px line, soft fill, crosshair that snaps to the nearest point. */
export function AreaChart({
  points,
  label,
  color = 'var(--primary)',
  format,
  height = 180,
}: {
  points: { x: string; y: number }[]
  label: string
  color?: string
  format: (v: number) => string
  height?: number
}) {
  const gid = useId()
  const box = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const ticks = niceTicks(Math.max(1, ...points.map((p) => p.y)))
  const top = ticks.at(-1)!
  const plotH = height - 24
  const W = 100
  const xs = (i: number) => (points.length === 1 ? W / 2 : (i / (points.length - 1)) * W)
  const ys = (v: number) => plotH - (v / top) * plotH
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${xs(i)},${ys(p.y)}`).join(' ')

  return (
    <div className="flex" style={{ height }}>
      <div className="relative w-10 shrink-0" style={{ height: plotH }}>
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
          const frac = (e.clientX - r.left) / r.width
          setHover(Math.max(0, Math.min(points.length - 1, Math.round(frac * (points.length - 1)))))
        }}
        onPointerLeave={() => setHover(null)}
      >
        <div className="absolute inset-x-0 top-0" style={{ height: plotH }}>
          {ticks.map((t) => (
            <div key={t} className={t === 0 ? 'absolute inset-x-0 border-t border-border-strong' : 'absolute inset-x-0 border-t border-border/70'} style={{ bottom: `${(t / top) * 100}%` }} />
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${plotH}`} preserveAspectRatio="none" className="absolute inset-x-0 top-0 w-full overflow-visible" style={{ height: plotH }} role="img" aria-label={`${label}: ${points.map((p) => `${p.x} ${format(p.y)}`).join(', ')}`}>
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L${W},${plotH} L0,${plotH} Z`} fill={`url(#${gid})`} />
          <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        {hover !== null && (
          <>
            <div className="pointer-events-none absolute top-0 w-px bg-border-strong" style={{ left: `${xs(hover)}%`, height: plotH }} />
            <div className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card" style={{ left: `${xs(hover)}%`, top: ys(points[hover].y), background: color }} />
            <ChartTooltip x={`${xs(hover)}%`} y={ys(points[hover].y)} title={points[hover].x} rows={[{ label, value: format(points[hover].y), color }]} />
          </>
        )}
        <div className="absolute inset-x-0 flex justify-between text-[11px] text-muted-foreground" style={{ top: plotH + 8 }}>
          {points.map((p) => (
            <span key={p.x}>{p.x}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
