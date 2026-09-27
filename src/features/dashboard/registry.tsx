import type { ComponentType } from 'react'
import {
  CalendarDays,
  CircleCheck,
  Clock,
  Dumbbell,
  GraduationCap,
  Hourglass,
  ListChecks,
  Moon,
  Music,
  NotebookPen,
  PenLine,
  Plus,
  Rocket,
  Target,
  Wallet,
  Repeat,
  type LucideIcon,
} from 'lucide-react'
import type { DashboardWidget, WidgetSize } from '@/types/domain'
import { CalendarWidget } from './widgets/CalendarWidget'
import { CountdownWidget } from './widgets/CountdownWidget'
import { ExamsWidget } from './widgets/ExamsWidget'
import { FinanceWidget } from './widgets/FinanceWidget'
import { GoalsWidget } from './widgets/GoalsWidget'
import { HabitsWidget } from './widgets/HabitsWidget'
import { SleepWidget, WorkoutWidget } from './widgets/HealthWidgets'
import { QuickNotesWidget, RecentNotesWidget } from './widgets/NotesWidgets'
import { QuickCaptureWidget } from './widgets/QuickCaptureWidget'
import { ScheduleWidget } from './widgets/ScheduleWidget'
import { SpotifyWidget } from './widgets/SpotifyWidget'
import { StartupWidget } from './widgets/StartupWidget'
import { StudyWidget } from './widgets/StudyWidget'
import { TasksWidget } from './widgets/TasksWidget'

export interface WidgetDefinition {
  type: string
  name: string
  description: string
  icon: LucideIcon
  defaultSize: WidgetSize
  sizes: WidgetSize[]
  component: ComponentType<{ widget: DashboardWidget }>
}

const ALL: WidgetSize[] = ['sm', 'md', 'lg', 'xl']

/** Every widget LifeOS knows about. Add one here and it appears in "Add widget". */
export const WIDGETS: WidgetDefinition[] = [
  { type: 'schedule', name: "Today's schedule", description: 'Your day, hour by hour.', icon: Clock, defaultSize: 'lg', sizes: ALL, component: ScheduleWidget },
  { type: 'calendar', name: 'Calendar', description: 'This month at a glance.', icon: CalendarDays, defaultSize: 'sm', sizes: ['sm', 'md'], component: CalendarWidget },
  { type: 'tasks', name: 'Tasks', description: 'What is due today.', icon: CircleCheck, defaultSize: 'md', sizes: ALL, component: TasksWidget },
  { type: 'spotify', name: 'Spotify', description: 'What is playing.', icon: Music, defaultSize: 'sm', sizes: ['sm', 'md'], component: SpotifyWidget },
  { type: 'goals', name: 'Goals', description: 'Progress on what matters.', icon: Target, defaultSize: 'md', sizes: ALL, component: GoalsWidget },
  { type: 'habits', name: 'Habits', description: 'Tick off today, see the week.', icon: Repeat, defaultSize: 'sm', sizes: ['sm', 'md', 'lg'], component: HabitsWidget },
  { type: 'study', name: 'Study progress', description: 'Topics covered per subject.', icon: GraduationCap, defaultSize: 'sm', sizes: ALL, component: StudyWidget },
  { type: 'exams', name: 'Upcoming exams', description: 'The next exams and how far away.', icon: ListChecks, defaultSize: 'sm', sizes: ['sm', 'md', 'lg'], component: ExamsWidget },
  { type: 'startup', name: 'Startup revenue', description: 'This month’s revenue and its trend.', icon: Rocket, defaultSize: 'md', sizes: ['sm', 'md', 'lg'], component: StartupWidget },
  { type: 'quickNotes', name: 'Quick notes', description: 'A scratchpad that saves itself.', icon: PenLine, defaultSize: 'md', sizes: ALL, component: QuickNotesWidget },
  { type: 'recentNotes', name: 'Recent notes', description: 'Jump back into your writing.', icon: NotebookPen, defaultSize: 'md', sizes: ALL, component: RecentNotesWidget },
  { type: 'workout', name: 'Workout', description: 'This week against your target.', icon: Dumbbell, defaultSize: 'sm', sizes: ['sm', 'md'], component: WorkoutWidget },
  { type: 'sleep', name: 'Sleep', description: 'The last seven nights.', icon: Moon, defaultSize: 'sm', sizes: ['sm', 'md'], component: SleepWidget },
  { type: 'finance', name: 'Finance', description: 'Spending against budget.', icon: Wallet, defaultSize: 'sm', sizes: ['sm', 'md'], component: FinanceWidget },
  { type: 'countdown', name: 'Countdown', description: 'Days until something important.', icon: Hourglass, defaultSize: 'sm', sizes: ['sm', 'md'], component: CountdownWidget },
  { type: 'quickCapture', name: 'Quick capture', description: 'Type and press enter.', icon: Plus, defaultSize: 'md', sizes: ['sm', 'md', 'lg', 'xl'], component: QuickCaptureWidget },
]

export const widgetByType = (type: string) => WIDGETS.find((w) => w.type === type)

/** Column span on the 12-column grid. Collapses gracefully on narrow screens. */
export const SIZE_CLASS: Record<WidgetSize, string> = {
  sm: 'col-span-12 md:col-span-6 xl:col-span-4',
  md: 'col-span-12 xl:col-span-6',
  lg: 'col-span-12 xl:col-span-8',
  xl: 'col-span-12',
}

export const SIZE_LABEL: Record<WidgetSize, string> = { sm: 'S', md: 'M', lg: 'L', xl: 'XL' }
