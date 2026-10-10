import { format } from 'date-fns'
import { Card, CardHeader } from '@/components/common/Card'
import { useSettings, type FunnelMonth } from '@/hooks/useSettings'
import { parseDay } from '@/lib/dates'

type Step = FunnelMonth['steps'][number]

const words = (s: string) => s.replace(/[_-]+/g, ' ')
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Step ids come from the website: s:03:how (section), q:price (question), f:04:phone (form field). */
function describe(id: string): { group: string; label: string } {
  const [kind, ...rest] = id.split(':')
  const name = words(rest.at(-1) ?? id)
  if (kind === 's') return { group: 'Page', label: capital(name) }
  if (kind === 'q') return { group: 'Questions opened', label: capital(name) }
  if (id === 'form:start') return { group: 'Form', label: 'Started the form' }
  if (kind === 'f') return { group: 'Form', label: `Reached “${name}”` }
  if (id === 'form:try') return { group: 'Form', label: 'Pressed send' }
  if (id === 'form:submit') return { group: 'Form', label: 'Sent' }
  return { group: 'Other', label: words(id) }
}

function duration(seconds: number) {
  const s = Math.round(seconds)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`
}

function Row({ label, count, base, time }: { label: string; count: number; base: number; time?: string }) {
  const share = base > 0 ? Math.min(count / base, 1) : 0
  return (
    <div className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_3rem_3rem_4rem] items-center gap-3 py-1 text-[13px]">
      <span className="truncate">{label}</span>
      <div className="h-1.5 rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${share * 100}%` }} />
      </div>
      <span className="text-right tabular">{count.toLocaleString('en')}</span>
      <span className="text-right text-muted-foreground tabular">{Math.round(share * 100)}%</span>
      <span className="text-right text-muted-foreground tabular">{time ?? ''}</span>
    </div>
  )
}

/** Where visitors get to on the website this month, read from the live numbers link. */
export function WebsiteFunnel({ visits }: { visits: (month: string) => number | undefined }) {
  const { marketingFunnel } = useSettings()
  const current = marketingFunnel.at(-1)
  if (!current?.steps.length) return null

  const top = Math.max(...current.steps.map((s) => s.count))
  // Every share is "of all visits"; if visits weren't counted that month, of the busiest step.
  const base = Math.max(visits(current.month) ?? 0, top)
  const groups: { group: string; steps: (Step & { label: string })[] }[] = []
  for (const step of current.steps) {
    const { group, label } = describe(step.id)
    if (groups.at(-1)?.group !== group) groups.push({ group, steps: [] })
    groups.at(-1)!.steps.push({ ...step, label })
  }

  return (
    <Card className="p-6">
      <CardHeader
        title="Website funnel"
        action={<span className="text-[12px] text-muted-foreground">{format(parseDay(`${current.month}-01`), 'MMMM yyyy')} · share of visits · avg. time</span>}
      />
      <div className="mt-4 flex flex-col gap-4">
        {groups.map((g) => (
          <div key={g.group}>
            <div className="label-caps mb-1">{g.group}</div>
            {g.steps.map((s) => (
              <Row key={s.id} label={s.label} count={s.count} base={base} time={s.seconds > 0 && s.count > 0 ? duration(s.seconds / s.count) : undefined} />
            ))}
          </div>
        ))}
      </div>
    </Card>
  )
}
