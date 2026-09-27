import { Panel } from '@/components/common/Card'
import { ProgressBar } from '@/components/common/Progress'
import { useMonthSummary } from '@/features/finance/hooks'
import { useMoney } from '@/hooks/useSettings'

export function FinanceWidget() {
  const { data } = useMonthSummary()
  const money = useMoney()
  if (!data) return <Panel title="Finance" href="/finance">{null}</Panel>
  const pct = data.budget ? (data.expenses / data.budget) * 100 : 0
  return (
    <Panel title="Finance" href="/finance">
      <div className="text-[12px] text-muted-foreground">Spent this month</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[26px] leading-none figure tabular">{money(data.expenses, { decimals: false })}</span>
        <span className="text-[13px] text-muted-foreground tabular">/ {money(data.budget, { decimals: false })}</span>
      </div>
      <ProgressBar className="mt-3" value={pct} tone={pct > 100 ? 'warn' : 'primary'} />
      <div className="mt-4 grid grid-cols-2 gap-3 text-[12.5px]">
        <div>
          <div className="text-muted-foreground">Income</div>
          <div className="mt-0.5 font-medium tabular">{money(data.income, { decimals: false })}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Saved</div>
          <div className="mt-0.5 font-medium tabular">{money(data.savings, { decimals: false })}</div>
        </div>
      </div>
    </Panel>
  )
}
