/** Horizontal bars for "where does it go" — one series, sorted, labels and values in text ink. */
export function BreakdownBars({ items, format }: { items: { label: string; value: number; hint?: string }[]; format: (v: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  const total = items.reduce((a, i) => a + i.value, 0)
  return (
    <div className="flex flex-col gap-3.5">
      {items.map((i) => (
        <div key={i.label} title={`${i.label}: ${format(i.value)}`}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate">{i.label}</span>
            <span className="shrink-0 tabular">
              {format(i.value)}
              <span className="ml-1.5 text-[11.5px] text-muted-foreground">{total ? Math.round((i.value / total) * 100) : 0}%</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-track">
            <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out-soft" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
          {i.hint && <div className="mt-1 text-[11.5px] text-faint">{i.hint}</div>}
        </div>
      ))}
    </div>
  )
}
