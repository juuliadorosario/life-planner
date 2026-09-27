import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type * as s from '@/db/schema'

export type Area = InferSelectModel<typeof s.areas>
export type Goal = InferSelectModel<typeof s.goals>
export type GoalMilestone = InferSelectModel<typeof s.goalMilestones>
export type Project = InferSelectModel<typeof s.projects>
export type Subject = InferSelectModel<typeof s.subjects>
export type SubjectTopic = InferSelectModel<typeof s.subjectTopics>
export type Exam = InferSelectModel<typeof s.exams>
export type Assignment = InferSelectModel<typeof s.assignments>
export type StudySession = InferSelectModel<typeof s.studySessions>
export type Task = InferSelectModel<typeof s.tasks>
export type NewTask = InferInsertModel<typeof s.tasks>
export type Note = InferSelectModel<typeof s.notes>
export type Habit = InferSelectModel<typeof s.habits>
export type HabitLog = InferSelectModel<typeof s.habitLogs>
export type Workout = InferSelectModel<typeof s.workouts>
export type WorkoutExercise = InferSelectModel<typeof s.workoutExercises>
export type SleepLog = InferSelectModel<typeof s.sleepLogs>
export type FinanceCategory = InferSelectModel<typeof s.financeCategories>
export type FinanceTransaction = InferSelectModel<typeof s.financeTransactions>
export type StartupMetric = InferSelectModel<typeof s.startupMetrics>
export type Link = InferSelectModel<typeof s.links>
export type LocalCalendarEvent = InferSelectModel<typeof s.calendarEvents>
export type DashboardWidget = InferSelectModel<typeof s.dashboardWidgets>

export type WidgetSize = DashboardWidget['size']
export type EventCategory = LocalCalendarEvent['category']

/** The things that other objects can be attached to. */
export type EntityType = 'task' | 'note' | 'project' | 'goal' | 'subject' | 'exam' | 'link' | 'habit' | 'workout'

export function newId(): string {
  return crypto.randomUUID()
}
