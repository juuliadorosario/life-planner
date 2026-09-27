import { Link } from 'react-router'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { useUI } from '@/app/ui-state'
import { Card, CardHeader, Panel } from '@/components/common/Card'
import { Page, PageHeader } from '@/components/common/PageHeader'
import { ProgressBar } from '@/components/common/Progress'
import { Button } from '@/components/ui/button'
import { useProjects } from '@/features/projects/hooks'
import { LinksPanel } from '@/features/shared/LinksPanel'
import { NotesList } from '@/features/shared/NotesList'
import { TabBar, useTab } from '@/features/shared/TabBar'
import { useLinkTargets } from '@/features/shared/useLinkTargets'
import { useTasks } from '@/features/tasks/hooks'
import { TaskRow } from '@/features/tasks/TaskRow'
import { useMoney, useSettings } from '@/hooks/useSettings'
import { parseDay } from '@/lib/dates'
import { useMetrics } from './hooks'
import { GroupedBarChart } from '@/components/charts/GroupedBarChart'
import { Legend } from '@/components/charts/ChartTooltip'
import { MetricTile, pctChange } from './MetricTile'
import { StartupBrand } from './StartupBrand'
import { StartupFinance } from './StartupFinance'
import { StartupMarketing } from './StartupMarketing'
import { StartupMetrics } from './StartupMetrics'
import { StartupTasks } from './StartupTasks'

const TABS = ['overview', 'projects', 'tasks', 'marketing', 'brand', 'finance', 'metrics'] as const

function MrrChart() {
  const { data: metrics = [] } = useMetrics()
  const money = useMoney()
  return (
    <GroupedBarChart
      data={metrics.map((m) => ({ ...m, label: format(parseDay(m.month), 'MMM') }))}
      categoryKey="label"
      series={[
        { key: 'mrr', label: 'MRR', color: 'var(--primary)' },
        { key: 'expenses', label: 'Expenses', color: 'var(--chart-muted)' },
      ]}
      format={(v) => money(v, { decimals: false })}
      height={200}
    />
  )
}

export function StartupPage() {
  const [tab, setTab] = useTab(TABS)
  const { startupName } = useSettings()
  const { areas } = useLinkTargets()
  const areaId = areas.find((a) => a.slug === 'startup')?.id
  const { data: metrics = [] } = useMetrics()
  const { data: projects = [] } = useProjects()
  const { data: tasks = [] } = useTasks({ areaId: areaId ?? '__none__' })
  const { openDialog } = useUI()
  const money = useMoney()
  const startupProjects = projects.filter((p) => p.areaId === areaId)
  const cur = metrics.at(-1)
  const prev = metrics.at(-2)

  return (
    <Page wide banner="startup">
      <PageHeader eyebrow="Startup" title={startupName} actions={<Button variant="outline" onClick={() => openDialog('project')}><Plus /> Project</Button>} />
      <TabBar tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid grid-cols-12 gap-5">
          <Card className="col-span-12 p-6 lg:col-span-8">
            <CardHeader title="This month" action={<button onClick={() => setTab('metrics')} className="text-[12px] text-muted-foreground hover:text-foreground">Update</button>} />
            {cur && (
              <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
                <MetricTile label="Revenue" value={money(cur.revenue, { decimals: false })} delta={pctChange(cur.revenue, prev?.revenue)} />
                <MetricTile label="MRR" value={money(cur.mrr, { decimals: false })} delta={pctChange(cur.mrr, prev?.mrr)} />
                <MetricTile label="Expenses" value={money(cur.expenses, { decimals: false })} delta={pctChange(cur.expenses, prev?.expenses)} invert />
                <MetricTile label="Users" value={String(cur.users)} delta={pctChange(cur.users, prev?.users)} />
              </div>
            )}
            <div className="mt-6">
              <MrrChart />
            </div>
            <div className="mt-3">
              <Legend items={[{ label: 'MRR', color: 'var(--primary)' }, { label: 'Expenses', color: 'var(--chart-muted)' }]} />
            </div>
          </Card>
          <div className="col-span-12 lg:col-span-4">
            <LinksPanel title="Quick links" filter={{ collection: 'startup' }} />
          </div>
          <Panel title="Projects" className="col-span-12 lg:col-span-4">
            {startupProjects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="-mx-2 block rounded-lg px-2 py-2.5 hover:bg-muted/60">
                <div className="mb-2 flex justify-between text-[13.5px]">
                  <span>{p.name}</span>
                  <span className="text-muted-foreground tabular">{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress} />
              </Link>
            ))}
          </Panel>
          <Panel title="Next up" className="col-span-12 lg:col-span-4">
            {tasks.slice(0, 6).map((t) => <TaskRow key={t.id} task={t} />)}
          </Panel>
          <div className="col-span-12 lg:col-span-4">
            <NotesList title="Notes" filter={{ areaId: areaId ?? '__none__' }} defaults={{ areaId, folder: 'Startup' }} />
          </div>
        </div>
      )}

      {tab === 'projects' && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {startupProjects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`}>
              <Card className="p-6 transition-colors hover:border-border-strong">
                <h3 className="text-[16px] font-semibold">{p.name}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">{p.description}</p>
                <ProgressBar value={p.progress} className="mt-5" />
              </Card>
            </Link>
          ))}
        </div>
      )}

      {tab === 'tasks' && <StartupTasks areaId={areaId} />}

      {tab === 'marketing' && <StartupMarketing />}

      {tab === 'brand' && <StartupBrand />}

      {tab === 'finance' && <StartupFinance />}

      {tab === 'metrics' && <StartupMetrics />}

    </Page>
  )
}
