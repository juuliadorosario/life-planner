import { useEffect, useMemo, useState } from 'react'
import { addMonths, format, startOfMonth } from 'date-fns'
import { ArrowDownRight, ArrowUpRight, Check, Target } from 'lucide-react'
import { Card, CardHeader } from '@/components/common/Card'
import { InlineText } from '@/components/common/InlineText'
import { ProgressBar } from '@/components/common/Progress'
import { Sparkline } from '@/components/common/Sparkline'
import { Button } from '@/components/ui/button'
import { getAllSettings, setSetting } from '@/db/repositories/settings'
import { useDbMutation, useDbQuery } from '@/hooks/data'
import { useMoney } from '@/hooks/useSettings'
import { parseDay, toDay } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { StartupMetric } from '@/types/domain'
import { useMetrics, useStartupActions } from './hooks'
import { pctChange } from './MetricTile'

type Key = 'revenue' | 'mrr' | 'expenses' | 'users'

const FIELDS: { key: Key; label: string; money: boolean; lowerIsBetter?: boolean }[] = [
  { key: 'mrr', label: 'MRR', money: true },
  { key: 'revenue', label: 'Revenue', money: true },
  { key: 'expenses', label: 'Expenses', money: true, lowerIsBetter: true },
  { key: 'users', label: 'Users', money: false },
]

function Delta({ value, lowerIsBetter }: { value: number | null; lowerIsBetter?: boolean }) {
  if (value == null || !Number.isFinite(value)) return <span className="text-[12px] text-faint">—</span>
  const good = lowerIsBetter ? value <= 0 : value >= 0
  return (
    <span className={cn('flex items-center gap-0.5 text-[12px] tabular', good ? 'text-primary' : 'text-destructive/90')}>
      {value >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {Math.abs(value).toFixed(0)}%
    </span>
  )
}

/** Compound monthly growth over the last `n` months (0.12 = 12%/month). */
function monthlyGrowth(values: number[], n = 3): number | null {
  const recent = values.slice(-(n + 1)).filter((v) => v > 0)
  if (recent.length < 2) return null
  return (recent.at(-1)! / recent[0]) ** (1 / (recent.length - 1)) - 1
}

function MonthForm({ metrics, month, onMonth }: { metrics: StartupMetric[]; month: string; onMonth: (m: string) => void }) {
  const { upsertMetric } = useStartupActions()
  const existing = metrics.find((m) => m.month === month)
  const empty = { revenue: '', mrr: '', expenses: '', users: '' }
  const [values, setValues] = useState<Record<Key, string>>(empty)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setValues(existing ? { revenue: String(existing.revenue), mrr: String(existing.mrr), expenses: String(existing.expenses), users: String(existing.users) } : empty)
    setSaved(false)
  }, [month, existing?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const thisMonth = toDay(startOfMonth(new Date()))
  const options = [...new Set([thisMonth, ...metrics.map((m) => m.month)])].sort().reverse()

  return (
    <Card className="p-6">
      <CardHeader title="Log a month" />
      <div className="mt-4 flex flex-wrap gap-1.5">
        {options.slice(0, 6).map((m) => (
          <button
            key={m}
            onClick={() => onMonth(m)}
            className={cn('h-7 rounded-full px-3 text-[12.5px] transition-colors', m === month ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')}
          >
            {format(parseDay(m), 'MMM')}
            {!metrics.some((x) => x.month === m) && <span className="ml-1 text-[10px] opacity-70">new</span>}
          </button>
        ))}
      </div>
      <form
        className="mt-5 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          upsertMetric.mutate(
            { month, values: { revenue: Number(values.revenue) || 0, mrr: Number(values.mrr) || 0, expenses: Number(values.expenses) || 0, users: Number(values.users) || 0 } },
            { onSuccess: () => setSaved(true) },
          )
        }}
      >
        {FIELDS.map((f) => (
          <label key={f.key} className="flex items-center justify-between gap-4 border-b border-border pb-3">
            <span className="text-[13.5px] text-muted-foreground">{f.label}</span>
            <span className="flex items-baseline gap-1">
              {f.money && <span className="text-[13px] text-faint">€</span>}
              <input
                type="number"
                min={0}
                step={f.money ? '0.01' : '1'}
                value={values[f.key]}
                placeholder="0"
                onChange={(e) => {
                  setValues({ ...values, [f.key]: e.target.value })
                  setSaved(false)
                }}
                className="figure w-28 bg-transparent text-right text-[19px] tabular outline-none placeholder:text-faint [&::-webkit-inner-spin-button]:appearance-none"
              />
            </span>
          </label>
        ))}
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[12px] text-faint">{format(parseDay(month), 'MMMM yyyy')}</span>
          <Button type="submit" size="sm">
            {saved ? <Check /> : null}
            {saved ? 'Saved' : existing ? 'Update' : 'Save month'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

/** Metrics: each number with its trend, the ratios that matter, and a goal. */
export function StartupMetrics() {
  const { data: metrics = [] } = useMetrics()
  const { data: settings } = useDbQuery(['settings'], getAllSettings)
  const setGoal = useDbMutation((v: number) => setSetting('mrrGoal', v))
  const money = useMoney()
  const short = (v: number) => money(v, { decimals: false })
  const [month, setMonth] = useState(() => toDay(startOfMonth(new Date())))

  const cur = metrics.at(-1)
  const prev = metrics.at(-2)
  const goal = Number(settings?.mrrGoal ?? 1000)
  const growth = monthlyGrowth(metrics.map((m) => m.mrr))
  const monthsToGoal = useMemo(() => {
    if (!cur || cur.mrr >= goal) return 0
    if (!growth || growth <= 0 || cur.mrr <= 0) return null
    return Math.ceil(Math.log(goal / cur.mrr) / Math.log(1 + growth))
  }, [cur, goal, growth])

  const ratios = cur
    ? [
        { label: 'ARR', value: short(cur.mrr * 12), hint: 'MRR × 12' },
        { label: 'MRR growth', value: growth != null ? `${(growth * 100).toFixed(0)}%` : '—', hint: 'per month, last 3 months' },
        { label: 'ARPU', value: cur.users ? money(cur.mrr / cur.users) : '—', hint: 'MRR per user' },
        { label: 'Cost per user', value: cur.users ? money(cur.expenses / cur.users) : '—', hint: 'expenses ÷ users' },
        { label: 'Margin', value: cur.revenue ? `${Math.round(((cur.revenue - cur.expenses) / cur.revenue) * 100)}%` : '—', hint: '(revenue − expenses) ÷ revenue' },
        { label: 'Profitable months', value: `${metrics.filter((m) => m.revenue > m.expenses).length}/${metrics.length}`, hint: 'revenue above expenses' },
      ]
    : []

  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-12 flex flex-col gap-5 xl:col-span-8">
        {/* One card per metric, with its six-month trend. */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FIELDS.map((f) => {
            const series = metrics.map((m) => m[f.key])
            const value = cur?.[f.key] ?? 0
            return (
              <Card key={f.key} className="p-5">
                <div className="flex items-center justify-between">
                  <span className="label-caps">{f.label}</span>
                  <Delta value={pctChange(value, prev?.[f.key])} lowerIsBetter={f.lowerIsBetter} />
                </div>
                <div className="figure mt-3 text-[29px] leading-none tabular">{f.money ? short(value) : value}</div>
                <div className="mt-4">
                  <Sparkline values={series} height={44} />
                </div>
                <div className="mt-1 flex justify-between text-[10.5px] text-faint">
                  <span>{metrics[0] ? format(parseDay(metrics[0].month), 'MMM') : ''}</span>
                  <span>{cur ? format(parseDay(cur.month), 'MMM') : ''}</span>
                </div>
              </Card>
            )
          })}
        </div>

        <Card className="p-6">
          <CardHeader title="Key ratios" action={<span className="text-[12px] text-muted-foreground">{cur ? format(parseDay(cur.month), 'MMMM') : ''}</span>} />
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-3">
            {ratios.map((r) => (
              <div key={r.label}>
                <div className="text-[12px] text-muted-foreground">{r.label}</div>
                <div className="figure mt-1 text-[21px] leading-tight tabular">{r.value}</div>
                <div className="mt-0.5 text-[11.5px] text-faint">{r.hint}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <CardHeader title="History" />
          <table className="mt-4 w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] text-muted-foreground">
                <th className="pb-2 font-normal">Month</th>
                {FIELDS.map((f) => (
                  <th key={f.key} className="pb-2 text-right font-normal">{f.label}</th>
                ))}
                <th className="pb-2 text-right font-normal">MRR MoM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...metrics].reverse().map((m, i, arr) => (
                <tr key={m.id} onClick={() => setMonth(m.month)} className={cn('cursor-default transition-colors hover:bg-muted/50', m.month === month && 'bg-muted/60')}>
                  <td className="py-2.5 pl-1">{format(parseDay(m.month), 'MMM yyyy')}</td>
                  {FIELDS.map((f) => (
                    <td key={f.key} className="py-2.5 text-right tabular">{f.money ? short(m[f.key]) : m[f.key]}</td>
                  ))}
                  <td className="py-2.5 pr-1 text-right">
                    <span className="inline-flex justify-end"><Delta value={pctChange(m.mrr, arr[i + 1]?.mrr)} /></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[12px] text-faint">Click a month to edit it.</p>
        </Card>
      </div>

      <div className="col-span-12 flex flex-col gap-5 xl:col-span-4">
        <Card className="p-6">
          <CardHeader title="MRR goal" action={<Target className="size-3.5 text-muted-foreground" />} />
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="figure text-[29px] leading-none tabular">{short(cur?.mrr ?? 0)}</span>
            <span className="text-[14px] text-muted-foreground">of</span>
            <span className="flex items-baseline text-[14px] text-muted-foreground">
              €
              <InlineText value={String(goal)} onSave={(v) => Number(v) > 0 && setGoal.mutate(Number(v))} className="w-16 text-[14px] tabular" />
            </span>
          </div>
          <ProgressBar value={((cur?.mrr ?? 0) / goal) * 100} className="mt-4 h-1.5" />
          <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
            {monthsToGoal === 0
              ? 'Goal reached. Time to set a bigger one.'
              : monthsToGoal == null
                ? 'Log a few months of growing MRR to see a projection.'
                : (
                  <>
                    At {((growth ?? 0) * 100).toFixed(0)}% a month you reach it around{' '}
                    <span className="font-medium text-foreground">{format(addMonths(parseDay(cur!.month), monthsToGoal), 'MMMM yyyy')}</span>
                    {' '}({monthsToGoal} {monthsToGoal === 1 ? 'month' : 'months'}).
                  </>
                )}
          </p>
        </Card>
        <MonthForm metrics={metrics} month={month} onMonth={setMonth} />
        <p className="px-1 text-[12px] leading-relaxed text-faint">Entered by hand for now. Stripe or an analytics provider can fill these in automatically later.</p>
      </div>
    </div>
  )
}
