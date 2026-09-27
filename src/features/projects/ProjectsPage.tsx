import { useState } from 'react'
import { Link } from 'react-router'
import { FolderKanban, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { useUI } from '@/app/ui-state'
import { Card } from '@/components/common/Card'
import { areaCategory, CategoryDot } from '@/components/common/CategoryDot'
import { EmptyState } from '@/components/common/EmptyState'
import { Page, PageHeader } from '@/components/common/PageHeader'
import { ProgressBar } from '@/components/common/Progress'
import { Button } from '@/components/ui/button'
import { PhotoSlot } from '@/features/photos/PhotoSlot'
import { defaultCover, PROJECT_COVERS } from '@/features/photos/builtin'
import { parseDay } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { useLinkTargets } from '@/features/shared/useLinkTargets'
import { useProjects } from './hooks'

export function ProjectsPage() {
  const { data: projects = [] } = useProjects()
  const { areas } = useLinkTargets()
  const { openDialog } = useUI()
  const [filter, setFilter] = useState<'active' | 'all'>('active')
  const shown = projects.filter((p) => filter === 'all' || p.status === 'active')

  return (
    <Page banner="projects" bannerCount={4}>
      <PageHeader
        eyebrow="Projects"
        title="What you're building"
        actions={
          <Button onClick={() => openDialog('project')}>
            <Plus /> New project
          </Button>
        }
      />
      <div className="mb-6 flex gap-1">
        {(['active', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn('h-8 rounded-lg px-3 text-[13px] capitalize', filter === f ? 'bg-card font-medium shadow-card ring-1 ring-border' : 'text-muted-foreground hover:bg-muted')}>
            {f}
          </button>
        ))}
      </div>
      {shown.length ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {shown.map((p) => {
            const area = areas.find((a) => a.id === p.areaId)
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="group/p">
                <Card className="flex h-full flex-col overflow-hidden transition-[border-color,transform] duration-200 group-hover/p:-translate-y-0.5 group-hover/p:border-border-strong">
                  <PhotoSlot slot={`cover.project.${p.id}`} fallback={defaultCover(projects.findIndex((x) => x.id === p.id), PROJECT_COVERS)} className="aspect-[16/7] w-full" rounded="rounded-none" placeholder="Add a cover" />
                  <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <CategoryDot category={areaCategory(area?.slug)} />
                    {area?.name ?? 'No area'}
                    {p.status !== 'active' && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] capitalize">{p.status}</span>}
                  </div>
                  <h3 className="display text-title-soft mt-2 text-[22px] leading-tight">{p.name}</h3>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-[13.5px] leading-relaxed text-muted-foreground">{p.description}</p>
                  <div className="mt-6">
                    <div className="mb-2 flex justify-between text-[12px] text-muted-foreground tabular">
                      <span>
                        {p.doneCount}/{p.taskCount} tasks
                      </span>
                      <span>{p.deadline ? `Due ${format(parseDay(p.deadline), 'MMM d')}` : `${p.progress}%`}</span>
                    </div>
                    <ProgressBar value={p.progress} />
                  </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card>
          <EmptyState icon={FolderKanban} title="No projects yet." action={<Button variant="outline" size="sm" onClick={() => openDialog('project')}><Plus /> Create project</Button>} />
        </Card>
      )}
    </Page>
  )
}
