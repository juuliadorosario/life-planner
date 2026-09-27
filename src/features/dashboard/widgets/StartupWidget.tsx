import { Card, CardHeader } from '@/components/common/Card'
import { Sparkline } from '@/components/common/Sparkline'
import { pctChange } from '@/features/startup/MetricTile'
import { useMetrics } from '@/features/startup/hooks'
import { useMoney, useSettings } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'

/** Home glance at the startup: this month's revenue and its trend. The rest lives in Startup. */
export function StartupWidget() {
  const { data: metrics = [] } = useMetrics()
  const { startupName } = useSettings()
  const money = useMoney()
  const cur = metrics.at(-1)
  const prev = metrics.at(-2)
  const delta = cur ? pctChange(cur.revenue, prev?.revenue) : null
  return (
    <Card className="flex flex-col p-5">
      <CardHeader title={startupName} href="/startup" action={<span className="text-[12px] text-muted-foreground">Revenue · this month</span>} />
      {cur ? (
        <>
          <div className="mt-4 flex items-end gap-3">
            <span className="figure text-[36px] leading-none tabular">{money(cur.revenue, { decimals: false })}</span>
            {delta != null && (
              <span className={cn('pb-1 text-[12.5px] tabular', delta >= 0 ? 'text-primary' : 'text-destructive')}>
                {delta >= 0 ? '+' : '−'}
                {Math.abs(delta).toFixed(0)}% vs last month
              </span>
            )}
          </div>
          <div className="mt-auto pt-5">
            <Sparkline values={metrics.map((m) => m.revenue)} height={48} />
            <div className="mt-1 text-[11px] text-faint">Revenue, last {metrics.length} months</div>
          </div>
        </>
      ) : (
        <p className="mt-3 text-[13px] text-muted-foreground">Add this month’s revenue in Startup → Metrics.</p>
      )}
    </Card>
  )
}
