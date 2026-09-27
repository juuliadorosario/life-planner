import { useState } from 'react'
import { addMonths, format, getDaysInMonth, isSameMonth } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Trash2, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { AreaChart } from '@/components/charts/AreaChart'
import { Legend } from '@/components/charts/ChartTooltip'
import { GroupedBarChart } from '@/components/charts/GroupedBarChart'
import { PaceChart } from '@/components/charts/PaceChart'
import { Card, CardHeader, Panel } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { Page, PageHeader } from '@/components/common/PageHeader'
import { ProgressBar } from '@/components/common/Progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FormDialog, OptionSelect } from '@/features/shared/CreateDialogs'
import { useMoney } from '@/hooks/useSettings'
import { parseDay, today } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { FinanceTransaction } from '@/types/domain'
import { useCategories, useFinanceActions, useMonthlyTotals, useMonthSummary, useTransactions } from './hooks'

export function TransactionDialog({ onClose, defaultScope = 'personal' }: { onClose: () => void; defaultScope?: FinanceTransaction['scope'] }) {
  const { data: categories = [] } = useCategories()
  const { create } = useFinanceActions()
  const [kind, setKind] = useState<FinanceTransaction['kind']>('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [date, setDate] = useState(today())
  const [scope, setScope] = useState<FinanceTransaction['scope']>(defaultScope)
  const options = categories.filter((c) => c.kind === kind)
  return (
    <FormDialog
      open
      title="New transaction"
      onClose={onClose}
      submitLabel="Add"
      disabled={!description.trim() || !(Number(amount) > 0)}
      onSubmit={() => create.mutate({ kind, description: description.trim(), amount: Number(amount), categoryId, date, scope }, { onSuccess: onClose })}
    >
      <div className="flex rounded-lg bg-muted p-0.5">
        {(['expense', 'income'] as const).map((k) => (
          <button type="button" key={k} onClick={() => { setKind(k); setCategoryId(null) }} className={cn('h-8 flex-1 rounded-md text-[13px] capitalize', kind === k ? 'bg-card font-medium shadow-card' : 'text-muted-foreground')}>
            {k}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_120px] gap-3">
        <Field label="Description"><Input autoFocus value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Groceries" /></Field>
        <Field label="Amount"><Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Category"><OptionSelect value={categoryId} onChange={setCategoryId} options={options} placeholder="Choose" /></Field>
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Scope"><OptionSelect value={scope} onChange={(v) => setScope((v as FinanceTransaction['scope']) ?? 'personal')} options={[{ id: 'personal', name: 'Personal' }, { id: 'startup', name: 'Startup' }]} placeholder="Scope" /></Field>
      </div>
    </FormDialog>
  )
}

export function FinancePage() {
  const [month, setMonth] = useState(() => new Date())
  const { data: summary } = useMonthSummary(month)
  const { data: tx = [] } = useTransactions({ month })
  const { data: categories = [] } = useCategories()
  const { remove } = useFinanceActions()
  const [adding, setAdding] = useState(false)
  const money = useMoney()
  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? 'Other'
  const left = summary ? summary.budget - summary.expenses : 0
  const { data: allTotals = [] } = useMonthlyTotals(6, month)
  // Months with nothing logged would read as 0% saved; leave them out.
  const totals = allTotals.filter((t, i) => t.income || t.expenses || i === allTotals.length - 1)
  const rate = (t: { income: number; savings: number }) => (t.income ? (t.savings / t.income) * 100 : 0)
  const rateNow = Math.round(rate(totals.at(-1) ?? { income: 0, savings: 0 }))
  const avgRate = totals.length ? Math.round(totals.reduce((a, t) => a + rate(t), 0) / totals.length) : 0
  // Daily expenses for the pace chart; stops at today in the current month.
  const daysInMonth = getDaysInMonth(month)
  const lastDay = isSameMonth(month, new Date()) ? new Date().getDate() : daysInMonth
  const daily = Array.from({ length: lastDay }, (_, i) =>
    tx.filter((t) => t.kind === 'expense' && Number(t.date.slice(8, 10)) === i + 1).reduce((a, t) => a + t.amount, 0),
  )
  const paceDiff = summary ? daily.reduce((a, v) => a + v, 0) - (summary.budget / daysInMonth) * lastDay : 0

  return (
    <Page wide banner="finance" bannerCount={4}>
      <PageHeader
        eyebrow="Finance"
        title={
          <span className="flex items-center gap-2">
            {format(month, 'MMMM yyyy')}
            <span className="flex">
              <Button variant="ghost" size="icon-sm" onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month"><ChevronLeft /></Button>
              <Button variant="ghost" size="icon-sm" disabled={isSameMonth(month, new Date())} onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month"><ChevronRight /></Button>
            </span>
          </span>
        }
        actions={<Button onClick={() => setAdding(true)}><Plus /> Transaction</Button>}
      />

      {summary && (
        <Card className="mb-5 grid grid-cols-2 divide-border p-0 md:grid-cols-4 md:divide-x">
          {[
            { label: 'Income', value: money(summary.income) },
            { label: 'Expenses', value: money(summary.expenses) },
            { label: 'Saved', value: money(summary.savings), accent: summary.savings >= 0 },
            { label: 'Budget left', value: money(left), warn: left < 0 },
          ].map((m) => (
            <div key={m.label} className="p-6">
              <div className="text-[12.5px] text-muted-foreground">{m.label}</div>
              <div className={cn('mt-2 text-[24px] leading-none figure tabular', m.accent && 'text-primary', m.warn && 'text-destructive')}>{m.value}</div>
            </div>
          ))}
        </Card>
      )}

      <div className="mb-5 grid grid-cols-12 gap-5">
        <Card className="col-span-12 p-6 lg:col-span-8">
          <CardHeader title="Income vs expenses" action={<Legend items={[{ label: 'Income', color: 'var(--primary)' }, { label: 'Expenses', color: 'var(--chart-muted)' }]} />} />
          <div className="mt-6">
            <GroupedBarChart
              data={totals.map((t) => ({ ...t, label: format(parseDay(t.month), 'MMM') }))}
              categoryKey="label"
              series={[
                { key: 'income', label: 'Income', color: 'var(--primary)' },
                { key: 'expenses', label: 'Expenses', color: 'var(--chart-muted)' },
              ]}
              format={(v) => money(v, { decimals: false })}
            />
          </div>
        </Card>
        <Card className="col-span-12 flex flex-col p-6 lg:col-span-4">
          <CardHeader title="Savings rate" action={<span className="text-[12px] text-muted-foreground">avg {avgRate}%</span>} />
          <div className="figure mt-4 text-[34px] leading-none tabular">{rateNow}%</div>
          <div className="mt-1.5 text-[12.5px] text-muted-foreground">of income saved in {format(month, 'MMMM')}</div>
          <div className="mt-auto pt-6">
            <AreaChart points={totals.map((t) => ({ x: format(parseDay(t.month), 'MMM'), y: Math.max(0, rate(t)) }))} label="saved" format={(v) => `${Math.round(v)}%`} height={120} />
          </div>
        </Card>
        {summary && (
          <Card className="col-span-12 p-6">
            <CardHeader
              title="Spending pace"
              action={
                <span className={cn('flex items-center gap-1.5 text-[12.5px]', paceDiff > 0 ? 'text-destructive' : 'text-primary')}>
                  {paceDiff > 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  {money(Math.abs(paceDiff), { decimals: false })} {paceDiff > 0 ? 'ahead of budget pace' : 'under budget pace'}
                </span>
              }
            />
            <div className="mt-6">
              <PaceChart daily={daily} budget={summary.budget} daysInMonth={daysInMonth} format={(v) => money(v, { decimals: false })} />
            </div>
            <div className="mt-3 flex gap-4 text-[11.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-[2px] w-3 rounded-full bg-primary" /> Spent so far</span>
              <span className="flex items-center gap-1.5"><span className="w-3 border-t-[1.5px] border-dashed border-faint" /> Even pace to {money(summary.budget, { decimals: false })}</span>
            </div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-12 gap-5">
        <Panel title="Budget by category" className="col-span-12 lg:col-span-5">
          <div className="flex flex-col gap-4">
            {summary?.byCategory.map((c) => {
              const pct = c.budget ? (c.spent / c.budget) * 100 : 0
              return (
                <div key={c.categoryId}>
                  <div className="mb-1.5 flex justify-between text-[13px]">
                    <span>{c.name}</span>
                    <span className="text-muted-foreground tabular">
                      <span className={cn('text-foreground', pct > 100 && 'text-destructive')}>{money(c.spent, { decimals: false })}</span>
                      {c.budget ? ` / ${money(c.budget, { decimals: false })}` : ''}
                    </span>
                  </div>
                  <ProgressBar value={pct} tone={pct > 100 ? 'warn' : pct > 85 ? 'muted' : 'primary'} />
                </div>
              )
            })}
          </div>
        </Panel>
        <Card className="col-span-12 p-5 lg:col-span-7">
          <CardHeader title="Transactions" action={<span className="text-[12px] text-muted-foreground">{tx.length}</span>} />
          {tx.length ? (
            <div className="mt-2 divide-y divide-border">
              {tx.map((t) => (
                <div key={t.id} className="group/t flex items-center gap-4 py-2.5">
                  <div className="w-12 shrink-0 text-[12px] text-muted-foreground tabular">{format(parseDay(t.date), 'MMM d')}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px]">{t.description}</div>
                    <div className="text-[12px] text-muted-foreground">
                      {catName(t.categoryId)}
                      {t.scope === 'startup' && ' · Startup'}
                    </div>
                  </div>
                  <span className={cn('text-[13.5px] tabular', t.kind === 'income' && 'text-primary')}>
                    {t.kind === 'income' ? '+' : '−'}
                    {money(t.amount)}
                  </span>
                  <button onClick={() => remove.mutate(t.id)} className="opacity-0 transition-opacity group-hover/t:opacity-100" aria-label="Delete transaction">
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact icon={Wallet} title="No transactions this month." />
          )}
        </Card>
      </div>
      {adding && <TransactionDialog onClose={() => setAdding(false)} />}
    </Page>
  )
}
