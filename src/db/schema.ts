/**
 * LifeOS database schema.
 *
 * Everything is relational on purpose: tasks, notes, sessions and events point
 * at the project / subject / goal / exam they belong to, so any object can show
 * what is connected to it. IDs are text UUIDs, dates are ISO strings
 * (`YYYY-MM-DD` for days, full ISO for timestamps).
 */
import { sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

const id = () => text('id').primaryKey()
const createdAt = () =>
  text('created_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)

export const areas = sqliteTable('areas', {
  id: id(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const goals = sqliteTable('goals', {
  id: id(),
  title: text('title').notNull(),
  description: text('description'),
  areaId: text('area_id').references(() => areas.id),
  deadline: text('deadline'),
  /** Manual progress 0–100, used when a goal has no milestones. */
  progress: integer('progress').notNull().default(0),
  status: text('status', { enum: ['active', 'achieved', 'archived'] }).notNull().default('active'),
  createdAt: createdAt(),
})

export const goalMilestones = sqliteTable('goal_milestones', {
  id: id(),
  goalId: text('goal_id')
    .notNull()
    .references(() => goals.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const projects = sqliteTable('projects', {
  id: id(),
  name: text('name').notNull(),
  description: text('description'),
  areaId: text('area_id').references(() => areas.id),
  goalId: text('goal_id').references(() => goals.id, { onDelete: 'set null' }),
  status: text('status', { enum: ['active', 'paused', 'done'] }).notNull().default('active'),
  deadline: text('deadline'),
  createdAt: createdAt(),
})

export const subjects = sqliteTable('subjects', {
  id: id(),
  name: text('name').notNull(),
  teacher: text('teacher'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: createdAt(),
})

export const subjectTopics = sqliteTable('subject_topics', {
  id: id(),
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const exams = sqliteTable('exams', {
  id: id(),
  title: text('title').notNull(),
  subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  time: text('time'),
  location: text('location'),
  description: text('description'),
  /** JSON array of topic names covered by the exam. */
  topics: text('topics', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  status: text('status', { enum: ['upcoming', 'done'] }).notNull().default('upcoming'),
  grade: text('grade'),
  createdAt: createdAt(),
})

export const assignments = sqliteTable('assignments', {
  id: id(),
  title: text('title').notNull(),
  subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'cascade' }),
  dueDate: text('due_date'),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  createdAt: createdAt(),
})

export const studySessions = sqliteTable('study_sessions', {
  id: id(),
  subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'cascade' }),
  examId: text('exam_id').references(() => exams.id, { onDelete: 'set null' }),
  title: text('title'),
  date: text('date').notNull(),
  startTime: text('start_time'),
  durationMin: integer('duration_min').notNull().default(60),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  notes: text('notes'),
  createdAt: createdAt(),
})

export const tasks = sqliteTable('tasks', {
  id: id(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['todo', 'doing', 'done'] }).notNull().default('todo'),
  /** 0 none · 1 low · 2 medium · 3 high */
  priority: integer('priority').notNull().default(0),
  dueDate: text('due_date'),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  areaId: text('area_id').references(() => areas.id),
  subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  goalId: text('goal_id').references(() => goals.id, { onDelete: 'set null' }),
  examId: text('exam_id').references(() => exams.id, { onDelete: 'set null' }),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  sortOrder: real('sort_order').notNull().default(0),
  createdAt: createdAt(),
  completedAt: text('completed_at'),
})

export const notes = sqliteTable('notes', {
  id: id(),
  title: text('title').notNull().default(''),
  /** Rich text as HTML (TipTap). */
  content: text('content').notNull().default(''),
  /** Plain-text mirror of `content`, used for search and backlinks. */
  contentText: text('content_text').notNull().default(''),
  folder: text('folder'),
  kind: text('kind', { enum: ['note', 'idea', 'link'] }).notNull().default('note'),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
  areaId: text('area_id').references(() => areas.id),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  goalId: text('goal_id').references(() => goals.id, { onDelete: 'set null' }),
  examId: text('exam_id').references(() => exams.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
  updatedAt: text('updated_at').notNull().default(''),
})

export const habits = sqliteTable('habits', {
  id: id(),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('circle'),
  goalId: text('goal_id').references(() => goals.id, { onDelete: 'set null' }),
  targetPerWeek: integer('target_per_week').notNull().default(7),
  sortOrder: integer('sort_order').notNull().default(0),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: createdAt(),
})

export const habitLogs = sqliteTable(
  'habit_logs',
  {
    id: id(),
    habitId: text('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
  },
  (t) => [uniqueIndex('habit_logs_habit_date').on(t.habitId, t.date)],
)

/** Saved workout videos (YouTube), e.g. at-home pilates. */
export const workoutVideos = sqliteTable('workout_videos', {
  id: id(),
  url: text('url').notNull(),
  youtubeId: text('youtube_id'),
  title: text('title').notNull(),
  channel: text('channel'),
  durationMin: integer('duration_min'),
  /** full body · core · legs · arms · back · stretch */
  focus: text('focus'),
  createdAt: createdAt(),
})

export const workouts = sqliteTable('workouts', {
  id: id(),
  date: text('date').notNull(),
  title: text('title').notNull(),
  kind: text('kind').notNull().default('strength'),
  durationMin: integer('duration_min').notNull().default(45),
  calories: integer('calories'),
  notes: text('notes'),
  goalId: text('goal_id').references(() => goals.id, { onDelete: 'set null' }),
  /** The video followed, when the workout was one. */
  videoId: text('video_id').references(() => workoutVideos.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
})

export const workoutExercises = sqliteTable('workout_exercises', {
  id: id(),
  workoutId: text('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sets: integer('sets'),
  reps: integer('reps'),
  weightKg: real('weight_kg'),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const sleepLogs = sqliteTable('sleep_logs', {
  id: id(),
  date: text('date').notNull().unique(),
  hours: real('hours').notNull(),
  quality: integer('quality').notNull().default(3),
})

export const financeCategories = sqliteTable('finance_categories', {
  id: id(),
  name: text('name').notNull(),
  kind: text('kind', { enum: ['income', 'expense'] }).notNull().default('expense'),
  monthlyBudget: real('monthly_budget'),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const financeTransactions = sqliteTable('finance_transactions', {
  id: id(),
  date: text('date').notNull(),
  description: text('description').notNull(),
  /** Always positive; direction comes from `kind`. */
  amount: real('amount').notNull(),
  kind: text('kind', { enum: ['income', 'expense'] }).notNull().default('expense'),
  categoryId: text('category_id').references(() => financeCategories.id, { onDelete: 'set null' }),
  /** `startup` transactions also feed the Startup area. */
  scope: text('scope', { enum: ['personal', 'startup'] }).notNull().default('personal'),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
})

export const startupMetrics = sqliteTable('startup_metrics', {
  id: id(),
  /** First day of the month, `YYYY-MM-01`. */
  month: text('month').notNull().unique(),
  revenue: real('revenue').notNull().default(0),
  mrr: real('mrr').notNull().default(0),
  expenses: real('expenses').notNull().default(0),
  users: integer('users').notNull().default(0),
})

export const links = sqliteTable('links', {
  id: id(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  /** Where the link is shown, e.g. `startup`, `study`, `resources`. */
  collection: text('collection').notNull().default('resources'),
  icon: text('icon'),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: createdAt(),
})

export const calendarEvents = sqliteTable('calendar_events', {
  id: id(),
  title: text('title').notNull(),
  start: text('start').notNull(),
  end: text('end').notNull(),
  allDay: integer('all_day', { mode: 'boolean' }).notNull().default(false),
  location: text('location'),
  category: text('category', { enum: ['school', 'study', 'health', 'startup', 'personal'] })
    .notNull()
    .default('personal'),
  /** Weekly recurrence: JSON array of weekdays (0 = Sunday). */
  repeatWeekdays: text('repeat_weekdays', { mode: 'json' }).$type<number[] | null>(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
})

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).$type<unknown>(),
})

export const dashboardWidgets = sqliteTable('dashboard_widgets', {
  id: id(),
  type: text('type').notNull(),
  position: integer('position').notNull(),
  size: text('size', { enum: ['sm', 'md', 'lg', 'xl'] }).notNull().default('md'),
  visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
  settings: text('settings', { mode: 'json' }).$type<Record<string, unknown>>().notNull().default(sql`'{}'`),
})

/** Photos added by the user (resized JPEG data URLs). Slots in the UI point at these. */
export const photos = sqliteTable('photos', {
  id: id(),
  data: text('data').notNull(),
  name: text('name'),
  createdAt: createdAt(),
})

/** Startup marketing: planned and published content, one row per post. */
export const marketingPosts = sqliteTable('marketing_posts', {
  id: id(),
  title: text('title').notNull(),
  /** instagram · linkedin · tiktok · web · email */
  channel: text('channel').notNull().default('instagram'),
  date: text('date'),
  status: text('status', { enum: ['idea', 'doing', 'published'] }).notNull().default('idea'),
  notes: text('notes'),
  createdAt: createdAt(),
})

/** Monthly audience numbers per channel (followers, visits, leads), entered by hand. */
export const channelStats = sqliteTable(
  'channel_stats',
  {
    id: id(),
    /** First day of the month, `YYYY-MM-01`. */
    month: text('month').notNull(),
    /** instagram · linkedin · tiktok · web · leads */
    channel: text('channel').notNull(),
    value: real('value').notNull().default(0),
  },
  (t) => [uniqueIndex('channel_stats_month_channel').on(t.month, t.channel)],
)
