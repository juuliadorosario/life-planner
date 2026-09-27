import { NavLink } from 'react-router'
import { PanelLeft, Plus, Search, Settings } from 'lucide-react'
import { useUI } from '@/app/ui-state'
import { Kbd } from '@/components/common/Kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSettings } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'
import { isTauri } from '@/providers/storage/StorageProvider'
import { LogoMark } from './Logo'
import { NAV_GROUPS, type NavItem } from './nav'
import { personal } from '@/config/personal'

function NavRow({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const link = (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          'group/nav relative flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] transition-colors duration-150',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-card font-medium text-foreground shadow-card ring-1 ring-border dark:bg-sidebar-accent dark:ring-transparent'
            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={cn('size-[16px] shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover/nav:text-foreground')}
            strokeWidth={1.75}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  )
  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { setPaletteOpen, setCaptureOpen } = useUI()
  const { userName, hiddenAreas } = useSettings()
  const native = isTauri()

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out-soft',
        collapsed ? 'w-[60px]' : 'w-[232px]',
      )}
    >
      {/* macOS traffic lights sit here in the native app. */}
      {native && <div className="drag-region h-7 shrink-0" />}
      <div className={cn('flex h-14 shrink-0 items-center', collapsed ? 'justify-center' : 'justify-between px-4')}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <LogoMark className="size-[22px]" />
            <span className={personal.wordmark === 'script' ? 'script text-[28px] leading-none' : 'font-display text-[16px] font-bold tracking-[-0.01em]'}>
              {personal.appName}
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeft className="size-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className={cn('flex flex-col gap-1', collapsed ? 'px-2.5' : 'px-3')}>
        <button
          onClick={() => setPaletteOpen(true)}
          className={cn(
            'flex h-8 items-center gap-2.5 rounded-lg text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground',
            collapsed ? 'justify-center' : 'px-2.5',
          )}
        >
          <Search className="size-[15px]" strokeWidth={1.75} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Search</span>
              <Kbd>⌘K</Kbd>
            </>
          )}
        </button>
        <button
          onClick={() => setCaptureOpen(true)}
          className={cn(
            'flex h-8 items-center gap-2.5 rounded-lg text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground',
            collapsed ? 'justify-center' : 'px-2.5',
          )}
        >
          <Plus className="size-[15px]" strokeWidth={1.75} />
          {!collapsed && <span className="flex-1 text-left">Quick capture</span>}
        </button>
      </div>

      <nav className={cn('mt-4 flex flex-1 flex-col overflow-y-auto', collapsed ? 'px-2.5' : 'px-3')}>
        {NAV_GROUPS.map((all) => all.filter((item) => !hiddenAreas.includes(item.to.slice(1)))).filter((g) => g.length).map((group, i) => (
          <div key={i} className={cn('flex flex-col gap-0.5', i > 0 && 'mt-3 border-t border-sidebar-border pt-3')}>
            {group.map((item) => (
              <NavRow key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      <div className={cn('flex flex-col gap-0.5 border-t border-sidebar-border py-3', collapsed ? 'px-2.5' : 'px-3')}>
        <NavRow item={{ label: 'Settings', to: '/settings', icon: Settings }} collapsed={collapsed} />
        <div className={cn('mt-2 flex items-center gap-2.5', collapsed ? 'justify-center' : 'px-1.5')}>
          <div className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-[12px] font-semibold text-primary">
            {(userName || 'Y').slice(0, 1).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-medium">{userName || 'You'}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                Local · works offline
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
