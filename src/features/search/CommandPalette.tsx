import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Command } from 'cmdk'
import {
  BookOpen,
  CalendarDays,
  CircleCheck,
  CornerDownLeft,
  FileText,
  FolderKanban,
  GraduationCap,
  HeartPulse,
  Link2,
  Moon,
  NotebookPen,
  Plus,
  Rocket,
  Search,
  Settings,
  Sun,
  Target,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useTheme } from '@/app/theme'
import { useUI } from '@/app/ui-state'
import { Kbd } from '@/components/common/Kbd'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { searchEverything, type SearchResult } from '@/db/repositories/search'
import { today } from '@/lib/dates'
import { openExternal } from '@/lib/open'
import type { EntityType } from '@/types/domain'

const TYPE_ICON: Record<EntityType, LucideIcon> = {
  task: CircleCheck,
  note: NotebookPen,
  project: FolderKanban,
  goal: Target,
  subject: BookOpen,
  exam: FileText,
  link: Link2,
  habit: Zap,
  workout: HeartPulse,
}
const TYPE_LABEL: Record<EntityType, string> = {
  task: 'Task',
  note: 'Note',
  project: 'Project',
  goal: 'Goal',
  subject: 'Subject',
  exam: 'Exam',
  link: 'Link',
  habit: 'Habit',
  workout: 'Workout',
}

interface CommandDef {
  id: string
  label: string
  group: 'Create' | 'Go to' | 'Actions'
  icon: LucideIcon
  shortcut?: string
  keywords?: string
  run: () => void
}

function Item({ onSelect, icon: Icon, children, hint, value }: { onSelect: () => void; icon: LucideIcon; children: React.ReactNode; hint?: React.ReactNode; value: string }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="group/item flex h-10 cursor-default items-center gap-3 rounded-lg px-3 text-[13.5px] text-foreground data-[selected=true]:bg-muted"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground group-data-[selected=true]/item:text-foreground" strokeWidth={1.75} />
      <span className="flex min-w-0 flex-1 items-baseline gap-2">{children}</span>
      {hint}
      <CornerDownLeft className="hidden size-3.5 text-muted-foreground group-data-[selected=true]/item:block" />
    </Command.Item>
  )
}

function Group({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="px-2 pb-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase"
    >
      {children}
    </Command.Group>
  )
}

/** ⌘K — every action and every object, one keystroke away. */
export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, openNewTask, setCaptureOpen, openDialog } = useUI()
  const navigate = useNavigate()
  const { resolved, setMode } = useTheme()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])

  useEffect(() => {
    if (!paletteOpen) setQuery('')
  }, [paletteOpen])

  useEffect(() => {
    let alive = true
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    const t = window.setTimeout(() => {
      void searchEverything(q).then((r) => alive && setResults(r))
    }, 80)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [query])

  const close = () => setPaletteOpen(false)
  const go = (to: string) => () => {
    close()
    navigate(to)
  }

  const commands: CommandDef[] = [
      { id: 'new-task', label: 'New task', group: 'Create', icon: Plus, shortcut: 'N', run: () => { close(); openNewTask({ dueDate: today() }) } },
      { id: 'new-note', label: 'New note', group: 'Create', icon: NotebookPen, run: go('/notes/new') },
      { id: 'new-project', label: 'New project', group: 'Create', icon: FolderKanban, run: () => { close(); openDialog('project') } },
      { id: 'new-goal', label: 'New goal', group: 'Create', icon: Target, run: () => { close(); openDialog('goal') } },
      { id: 'new-session', label: 'New study session', group: 'Create', icon: GraduationCap, keywords: 'study', run: () => { close(); openDialog('session') } },
      { id: 'new-exam', label: 'New exam', group: 'Create', icon: FileText, keywords: 'study test', run: () => { close(); openDialog('exam') } },
      { id: 'new-event', label: 'New calendar event', group: 'Create', icon: CalendarDays, run: () => { close(); openDialog('event') } },
      { id: 'capture', label: 'Quick capture', group: 'Create', icon: Zap, shortcut: '⌘⇧␣', run: () => { close(); setCaptureOpen(true) } },
      { id: 'go-home', label: 'Open Home', group: 'Go to', icon: Sun, keywords: 'dashboard', run: go('/') },
      { id: 'go-today', label: 'Open Today', group: 'Go to', icon: Sun, run: go('/today') },
      { id: 'go-tasks', label: 'Open Tasks', group: 'Go to', icon: CircleCheck, run: go('/tasks') },
      { id: 'go-calendar', label: 'Open Calendar', group: 'Go to', icon: CalendarDays, run: go('/calendar') },
      { id: 'go-study', label: 'Open Study', group: 'Go to', icon: GraduationCap, run: go('/study') },
      { id: 'go-startup', label: 'Open Startup', group: 'Go to', icon: Rocket, run: go('/startup') },
      { id: 'go-health', label: 'Open Health', group: 'Go to', icon: HeartPulse, keywords: 'workout habits sleep', run: go('/health') },
      { id: 'go-finance', label: 'Open Finance', group: 'Go to', icon: Wallet, keywords: 'money budget', run: go('/finance') },
      { id: 'go-notes', label: 'Open Notes', group: 'Go to', icon: NotebookPen, run: go('/notes') },
      { id: 'go-projects', label: 'Open Projects', group: 'Go to', icon: FolderKanban, run: go('/projects') },
      { id: 'go-goals', label: 'Open Goals', group: 'Go to', icon: Target, run: go('/goals') },
      { id: 'settings', label: 'Settings', group: 'Go to', icon: Settings, keywords: 'preferences', run: go('/settings') },
      { id: 'theme', label: resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', group: 'Actions', icon: resolved === 'dark' ? Sun : Moon, keywords: 'theme appearance', run: () => { setMode(resolved === 'dark' ? 'light' : 'dark'); close() } },
  ]

  const q = query.trim().toLowerCase()
  const shown = q ? commands.filter((c) => `${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(q)) : commands
  const groups = (['Create', 'Go to', 'Actions'] as const).map((g) => [g, shown.filter((c) => c.group === g)] as const)
  const resultGroups = useMemo(() => {
    const map = new Map<EntityType, SearchResult[]>()
    for (const r of results) map.set(r.type, [...(map.get(r.type) ?? []), r])
    return [...map.entries()]
  }, [results])

  return (
    <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <DialogContent showCloseButton={false} className="top-[16%] translate-y-0 gap-0 overflow-hidden p-0 shadow-float sm:max-w-[620px]">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command shouldFilter={false} loop className="flex flex-col">
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="size-4 text-muted-foreground" strokeWidth={1.75} />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search or type a command…"
              className="h-13 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
            />
            <Kbd>esc</Kbd>
          </div>
          <Command.List className="max-h-[min(440px,60vh)] overflow-y-auto py-2">
            <Command.Empty className="py-10 text-center text-[13px] text-muted-foreground">
              Nothing found for “{query}”.
            </Command.Empty>
            {resultGroups.map(([type, items]) => (
              <Group key={type} heading={`${TYPE_LABEL[type]}s`}>
                {items.map((r) => (
                  <Item
                    key={`${r.type}:${r.id}`}
                    value={`${r.type}:${r.id}`}
                    icon={TYPE_ICON[r.type]}
                    onSelect={() => {
                      close()
                      if (r.type === 'link') void openExternal(r.href)
                      else navigate(r.href)
                    }}
                    hint={r.context && <span className="max-w-[40%] truncate text-[12px] text-muted-foreground">{r.context}</span>}
                  >
                    <span className="truncate">{r.title}</span>
                  </Item>
                ))}
              </Group>
            ))}
            {groups.map(([group, items]) =>
              items.length ? (
                <Group key={group} heading={group}>
                  {items.map((c) => (
                    <Item key={c.id} value={c.id} icon={c.icon} onSelect={c.run} hint={c.shortcut && <Kbd className="group-data-[selected=true]/item:hidden">{c.shortcut}</Kbd>}>
                      {c.label}
                    </Item>
                  ))}
                </Group>
              ) : null,
            )}
          </Command.List>
          <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
            <span className="flex items-center gap-1.5"><Kbd>↵</Kbd> open</span>
            <span className="ml-auto">Searches tasks, notes, projects, subjects, exams, goals and links</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
