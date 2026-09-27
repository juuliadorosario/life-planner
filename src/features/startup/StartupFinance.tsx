import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Plus, Receipt } from 'lucide-react'
import { AreaChart } from '@/components/charts/AreaChart'
import { BreakdownBars } from '@/components/charts/BreakdownBars'
import { Legend } from '@/components/charts/ChartTooltip'
import { GroupedBarChart } from '@/components/charts/GroupedBarChart'
import { NetBars } from '@/components/charts/NetBars'
import { Card, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { TransactionDialog } from '@/features/finance/FinancePage'
import { useCategories, useTransactions } from '@/features/finance/hooks'
import { useProjects } from '@/features/projects/hooks'
import { useMoney } from '@/hooks/useSettings'
import { dayOffset, parseDay, relativeDay } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { useMetrics } from './hooks'
import { pctChange } from './MetricTile'

// Revenue carries the accent; expenses are the neutral "context" series.
const REVENUE = 'var(--primary)'
const EXPENSES = 'var(--chart-muted)'

function Hero({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="p-6">
      <div className="label-caps">{label}</div>
      <div className={cn('figure mt-3 text-[29px] leading-none tabular', tone === 'good' && 'text-primary', tone === 'bad' && 'text-destructive')}>{value}</div>
      {sub && <div className="mt-2 text-[12.5px] text-muted-foreground">{sub}</div>}
    </div>
  )
}

/** The money side of the startup: is it growing, what does it cost, where does it go. */
export function StartupFinance() {
  const { data: metrics = [] } = useMetrics()
  const { data: tx = [] } = useTransactions({ scope: 'startup' })
  const { data: projects = [] } = useProjects()
  const { data: categories = [] } = useCategories()
  const money = useMoney()
  const short = (v: number) => money(v, { decimals: false })
  const [adding, setAdding] = useState(false)

  const cur = metrics.at(-1)
  const prev = metrics.at(-2)
  const months = metrics.map((m) => ({ ...m, label: format(parseDay(m.month), 'MMM'), net: m.revenue - m.expenses }))
  const totalRevenue = metrics.reduce((a, m) => a + m.revenue, 0)
  const totalSpent = metrics.reduce((a, m) => a + m.expenses, 0)
  const coverage = cur && cur.expenses ? Math.round((cur.revenue / cur.expenses) * 100) : 0
  const avgBurn = metrics.length ? metrics.slice(-3).reduce((a, m) => a + m.expenses, 0) / Math.min(3, metrics.length) : 0

  // Where the money went in the last 90 days, by project.
  const breakdown = useMemo(() => {
    const since = dayOffset(-90)
    const map = new Map<string, number>()
    for (const t of tx) {
      if (t.kind !== 'expense' || t.date < since) continue
      const name = projects.find((p) => p.id === t.projectId)?.name ?? categories.find((c) => c.id === t.categoryId)?.name ?? 'Other'
      map.set(name, (map.get(name) ?? 0) + t.amount)
    }
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  }, [tx, projects, categories])

  if (!cur) {
    return <Card><EmptyState icon={Receipt} title="No metrics yet." description="Add this month's numbers in Metrics to see charts here." /></Card>
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Headline numbers */}
      <Card className="grid grid-cols-2 divide-border md:grid-cols-4 md:divide-x">
        <Hero label="MRR" value={short(cur.mrr)} sub={pctChange(cur.mrr, prev?.mrr) != null ? `${pctChange(cur.mrr, prev?.mrr)! >= 0 ? '+' : ''}${pctChange(cur.mrr, prev?.mrr)!.toFixed(0)}% vs last month` : 'First month'} />
        <Hero label="Monthly burn" value={short(cur.expenses)} sub={`${short(avgBurn)} avg, last 3 months`} />
        <Hero label="Net this month" value={short(cur.revenue - cur.expenses)} tone={cur.revenue - cur.expenses >= 0 ? 'good' : 'bad'} sub={coverage ? `Revenue covers ${coverage}% of costs` : undefined} />
        <Hero label="All time" value={short(totalRevenue - totalSpent)} sub={`${short(totalRevenue)} in · ${short(totalSpent)} out`} />
      </Card>

      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 p-6 lg:col-span-8">
          <CardHeader title="Revenue vs expenses" action={<Legend items={[{ label: 'Revenue', color: REVENUE }, { label: 'Expenses', color: EXPENSES }]} />} />
          <div className="mt-6">
            <GroupedBarChart
              data={months}
              categoryKey="label"
              series={[
                { key: 'revenue', label: 'Revenue', color: REVENUE },
                { key: 'expenses', label: 'Expenses', color: EXPENSES },
              ]}
              format={short}
            />
          </div>
        </Card>
        <Card className="col-span-12 flex flex-col p-6 lg:col-span-4">
          <CardHeader title="Where it goes" action={<span className="text-[12px] text-muted-foreground">90 days</span>} />
          <div className="mt-5">
            {breakdown.length ? <BreakdownBars items={breakdown} format={money} /> : <p className="text-[13px] text-muted-foreground">No startup expenses yet.</p>}
          </div>
          {cur.users > 0 && (
            <div className="mt-auto border-t border-border pt-5">
              <div className="mb-3 label-caps">Per user · this month</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="figure text-[22px] leading-none tabular">{money(cur.mrr / cur.users)}</div>
                  <div className="mt-1.5 text-[12px] text-muted-foreground">revenue</div>
                </div>
                <div>
                  <div className="figure text-[22px] leading-none tabular">{money(cur.expenses / cur.users)}</div>
                  <div className="mt-1.5 text-[12px] text-muted-foreground">cost</div>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="col-span-12 p-6 lg:col-span-6">
          <CardHeader title="Profit & loss" action={<span className="text-[12px] text-muted-foreground">per month</span>} />
          <div className="mt-6">
            <NetBars data={months.map((m) => ({ label: m.label, value: m.net }))} format={short} />
          </div>
        </Card>
        <Card className="col-span-12 p-6 lg:col-span-6">
          <CardHeader title="Users" action={<span className="text-[12px] text-muted-foreground tabular">{cur.users} now{pctChange(cur.users, prev?.users) != null && ` · +${pctChange(cur.users, prev?.users)!.toFixed(0)}%`}</span>} />
          <div className="mt-6">
            <AreaChart points={months.map((m) => ({ x: m.label, y: m.users }))} label="users" format={(v) => String(Math.round(v))} height={184} />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <CardHeader
          title="Transactions"
          action={
            <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
              <Plus /> Add
            </Button>
          }
        />
        <table className="mt-4 w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11.5px] text-muted-foreground">
              <th className="pb-2 font-normal">Date</th>
              <th className="pb-2 font-normal">Description</th>
              <th className="hidden pb-2 font-normal sm:table-cell">Project</th>
              <th className="pb-2 text-right font-normal">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tx.slice(0, 8).map((t) => (
              <tr key={t.id}>
                <td className="py-2.5 whitespace-nowrap text-muted-foreground tabular">{relativeDay(t.date)}</td>
                <td className="py-2.5">{t.description}</td>
                <td className="hidden py-2.5 text-muted-foreground sm:table-cell">{projects.find((p) => p.id === t.projectId)?.name ?? '—'}</td>
                <td className={cn('py-2.5 text-right tabular', t.kind === 'income' && 'text-primary')}>
                  {t.kind === 'income' ? '+' : '−'}
                  {money(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tx.length > 8 && <p className="mt-3 text-[12px] text-faint">Showing the latest 8 of {tx.length}. All of them are in Finance.</p>}
      </Card>
      {adding && <TransactionDialog defaultScope="startup" onClose={() => setAdding(false)} />}
    </div>
  )
}
