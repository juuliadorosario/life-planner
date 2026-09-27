import { getStorage } from '../client'

/**
 * Remove every piece of demo content and keep the structure: subjects (names
 * only), areas, finance categories, dashboard layout, photos, settings and
 * saved workout videos. The same clean-up a new user wants before filling in
 * their own life.
 */
export async function startEmpty(): Promise<void> {
  const statements = [
    'DELETE FROM workout_exercises WHERE workout_id IN (SELECT id FROM workouts WHERE video_id IS NULL)',
    'DELETE FROM workouts WHERE video_id IS NULL',
    'UPDATE workouts SET goal_id = NULL',
    'DELETE FROM sleep_logs',
    'DELETE FROM habit_logs',
    'DELETE FROM habits',
    'DELETE FROM tasks',
    'DELETE FROM notes',
    'DELETE FROM goal_milestones',
    'UPDATE projects SET goal_id = NULL',
    'DELETE FROM links',
    'DELETE FROM finance_transactions',
    'DELETE FROM projects',
    'DELETE FROM goals',
    'DELETE FROM study_sessions',
    'DELETE FROM assignments',
    'DELETE FROM exams',
    'DELETE FROM subject_topics',
    'UPDATE subjects SET teacher = NULL',
    'DELETE FROM calendar_events',
    'DELETE FROM startup_metrics',
    'DELETE FROM marketing_posts',
    'DELETE FROM channel_stats',
    'UPDATE finance_categories SET monthly_budget = NULL',
    "DELETE FROM settings WHERE key IN ('quickNotes', 'countdown')",
  ]
  const storage = getStorage()
  for (const sql of statements) await storage.query(sql, [], 'run')
}
