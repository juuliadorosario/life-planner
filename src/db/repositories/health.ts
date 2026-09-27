import { and, asc, desc, eq, gte, lte } from 'drizzle-orm'
import { db } from '../client'
import { habitLogs, habits, sleepLogs, workoutExercises, workoutVideos, workouts } from '../schema'
import { newId, type Workout, type WorkoutExercise } from '@/types/domain'

export async function listHabits() {
  return db().select().from(habits).where(eq(habits.archived, false)).orderBy(asc(habits.sortOrder))
}

export async function listHabitLogs(from: string, to: string) {
  return db()
    .select()
    .from(habitLogs)
    .where(and(gte(habitLogs.date, from), lte(habitLogs.date, to)))
}

export async function toggleHabit(habitId: string, date: string): Promise<void> {
  const existing = await db()
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)))
    .get()
  if (existing) await db().delete(habitLogs).where(eq(habitLogs.id, existing.id))
  else await db().insert(habitLogs).values({ id: newId(), habitId, date })
}

export async function createHabit(input: { name: string; targetPerWeek: number; icon?: string; goalId?: string | null }): Promise<void> {
  await db().insert(habits).values({ id: newId(), sortOrder: Date.now(), ...input })
}

export async function archiveHabit(id: string): Promise<void> {
  await db().update(habits).set({ archived: true }).where(eq(habits.id, id))
}

export interface WorkoutWithExercises extends Workout {
  exercises: WorkoutExercise[]
}

export async function listWorkouts(limit = 30): Promise<WorkoutWithExercises[]> {
  const [rows, ex] = await Promise.all([
    db().select().from(workouts).orderBy(desc(workouts.date)).limit(limit),
    db().select().from(workoutExercises).orderBy(asc(workoutExercises.sortOrder)),
  ])
  return rows.map((w) => ({ ...w, exercises: ex.filter((e) => e.workoutId === w.id) }))
}

export interface NewWorkoutInput {
  date: string
  title: string
  kind: string
  durationMin: number
  calories?: number | null
  notes?: string | null
  goalId?: string | null
  videoId?: string | null
  exercises: { name: string; sets?: number | null; reps?: number | null; weightKg?: number | null }[]
  /** Also tick this habit for the workout's day. */
  habitId?: string | null
}

export async function createWorkout(input: NewWorkoutInput): Promise<void> {
  const id = newId()
  const { exercises, habitId, ...rest } = input
  await db().insert(workouts).values({ id, ...rest })
  if (exercises.length) {
    await db()
      .insert(workoutExercises)
      .values(exercises.map((e, i) => ({ id: newId(), workoutId: id, sortOrder: i, ...e })))
  }
  if (habitId) {
    const logged = await db()
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, input.date)))
      .get()
    if (!logged) await db().insert(habitLogs).values({ id: newId(), habitId, date: input.date })
  }
}

export async function deleteWorkout(id: string): Promise<void> {
  await db().delete(workouts).where(eq(workouts.id, id))
}

export async function listSleep(days = 14) {
  return db().select().from(sleepLogs).orderBy(desc(sleepLogs.date)).limit(days)
}

export async function logSleep(date: string, hours: number, quality: number): Promise<void> {
  await db()
    .insert(sleepLogs)
    .values({ id: newId(), date, hours, quality })
    .onConflictDoUpdate({ target: sleepLogs.date, set: { hours, quality } })
}

export type WorkoutVideo = typeof workoutVideos.$inferSelect

export interface VideoWithStats extends WorkoutVideo {
  timesDone: number
  lastDone: string | null
}

export async function listVideos(): Promise<VideoWithStats[]> {
  const [videos, done] = await Promise.all([
    db().select().from(workoutVideos).orderBy(desc(workoutVideos.createdAt)),
    db().select({ videoId: workouts.videoId, date: workouts.date }).from(workouts),
  ])
  return videos.map((v) => {
    const mine = done.filter((w) => w.videoId === v.id).map((w) => w.date).sort()
    return { ...v, timesDone: mine.length, lastDone: mine.at(-1) ?? null }
  })
}

export async function addVideo(input: Omit<typeof workoutVideos.$inferInsert, 'id'>): Promise<void> {
  await db().insert(workoutVideos).values({ id: newId(), ...input })
}

export async function updateVideo(id: string, patch: Partial<Omit<WorkoutVideo, 'id'>>): Promise<void> {
  await db().update(workoutVideos).set(patch).where(eq(workoutVideos.id, id))
}

export async function deleteVideo(id: string): Promise<void> {
  await db().delete(workoutVideos).where(eq(workoutVideos.id, id))
}
