import { createHashRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { HomePage } from '@/features/dashboard/HomePage'
import { FinancePage } from '@/features/finance/FinancePage'
import { GoalPage } from '@/features/goals/GoalPage'
import { GoalsPage } from '@/features/goals/GoalsPage'
import { HealthPage } from '@/features/health/HealthPage'
import { NotesPage } from '@/features/notes/NotesPage'
import { ProjectPage } from '@/features/projects/ProjectPage'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { StartupPage } from '@/features/startup/StartupPage'
import { ExamPage } from '@/features/study/ExamPage'
import { StudyPage } from '@/features/study/StudyPage'
import { SubjectPage } from '@/features/study/SubjectPage'
import { TasksPage } from '@/features/tasks/TasksPage'
import { TodayPage } from '@/features/today/TodayPage'

// Hash routing works identically in the browser and inside the Tauri webview.
export const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/today', element: <TodayPage /> },
      { path: '/tasks', element: <TasksPage /> },
      { path: '/calendar', element: <CalendarPage /> },
      { path: '/study', element: <StudyPage /> },
      { path: '/study/subjects/:id', element: <SubjectPage /> },
      { path: '/study/exams/:id', element: <ExamPage /> },
      { path: '/startup', element: <StartupPage /> },
      { path: '/health', element: <HealthPage /> },
      { path: '/finance', element: <FinancePage /> },
      { path: '/notes', element: <NotesPage /> },
      { path: '/notes/:id', element: <NotesPage /> },
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/projects/:id', element: <ProjectPage /> },
      { path: '/goals', element: <GoalsPage /> },
      { path: '/goals/:id', element: <GoalPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '*', element: <HomePage /> },
    ],
  },
])
