import {
  CalendarDays,
  CircleCheck,
  FolderKanban,
  GraduationCap,
  HeartPulse,
  House,
  NotebookPen,
  Rocket,
  Sun,
  Target,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

/** Sidebar groups, top to bottom. Settings lives in the footer. */
export const NAV_GROUPS: NavItem[][] = [
  [
    { label: 'Home', to: '/', icon: House },
    { label: 'Today', to: '/today', icon: Sun },
    { label: 'Tasks', to: '/tasks', icon: CircleCheck },
    { label: 'Calendar', to: '/calendar', icon: CalendarDays },
  ],
  [
    { label: 'Study', to: '/study', icon: GraduationCap },
    { label: 'Startup', to: '/startup', icon: Rocket },
    { label: 'Health', to: '/health', icon: HeartPulse },
    { label: 'Finance', to: '/finance', icon: Wallet },
  ],
  [
    { label: 'Notes', to: '/notes', icon: NotebookPen },
    { label: 'Projects', to: '/projects', icon: FolderKanban },
    { label: 'Goals', to: '/goals', icon: Target },
  ],
]
