import { useCallback, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useUI } from '@/app/ui-state'
import { useAppleCalendarSync } from '@/features/calendar/AppleCalendarConnect'
import { Onboarding } from '@/features/onboarding/Onboarding'
import { CommandPalette } from '@/features/search/CommandPalette'
import { getAllSettings } from '@/db/repositories/settings'
import { useDbQuery } from '@/hooks/data'
import { QuickCapture } from '@/features/capture/QuickCapture'
import { Assistant } from '@/features/assistant/Assistant'
import { TaskDialogs } from '@/features/tasks/TaskDialogs'
import { CreateDialogs } from '@/features/shared/CreateDialogs'
import { useHotkeys } from '@/hooks/useHotkeys'
import { Sidebar } from './Sidebar'

function readCollapsed() {
  try {
    return localStorage.getItem('lifeos.sidebar') === 'collapsed'
  } catch {
    return false
  }
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const { setPaletteOpen, setCaptureOpen, openNewTask } = useUI()
  // First run: settings loaded and no `onboarded` flag yet.
  const { data: rawSettings } = useDbQuery(['settings'], getAllSettings)
  const [setupDone, setSetupDone] = useState(false)
  const showSetup = !!rawSettings && !rawSettings.onboarded && !setupDone
  useAppleCalendarSync()
  const navigate = useNavigate()
  const location = useLocation()

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      try {
        localStorage.setItem('lifeos.sidebar', c ? 'expanded' : 'collapsed')
      } catch {
        /* storage unavailable */
      }
      return !c
    })
  }, [])

  const bindings = useMemo(
    () => [
      { combo: 'mod+k', handler: () => setPaletteOpen(true) },
      { combo: 'mod+shift+space', handler: () => setCaptureOpen(true) },
      { combo: 'mod+\\', handler: toggle },
      { combo: 'n', handler: () => (location.pathname.startsWith('/notes') ? navigate('/notes/new') : openNewTask()) },
      { combo: '/', handler: () => setPaletteOpen(true) },
    ],
    [setPaletteOpen, setCaptureOpen, toggle, openNewTask, navigate, location.pathname],
  )
  useHotkeys(bindings)

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <main className="min-w-0 flex-1">
        {/* Keyed by path so every page gets the soft entrance animation. */}
        <div key={location.pathname.split('/').slice(0, 2).join('/')}>
          <Outlet />
        </div>
      </main>
      <CommandPalette />
      <QuickCapture />
      <Assistant />
      <TaskDialogs />
      <CreateDialogs />
      {showSetup && <Onboarding onClose={() => setSetupDone(true)} />}
    </div>
  )
}
