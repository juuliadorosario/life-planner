import * as repo from '@/db/repositories/health'
import { useDbMutation, useDbQuery } from '@/hooks/data'

export const useHabits = () => useDbQuery(['habits'], repo.listHabits)
export const useHabitLogs = (from: string, to: string) => useDbQuery(['habit-logs', from, to], () => repo.listHabitLogs(from, to))
export const useWorkouts = (limit = 30) => useDbQuery(['workouts', limit], () => repo.listWorkouts(limit))
export const useVideos = () => useDbQuery(['workout-videos'], repo.listVideos)
export const useSleep = (days = 14) => useDbQuery(['sleep', days], () => repo.listSleep(days))

export function useHealthActions() {
  return {
    toggleHabit: useDbMutation(({ habitId, date }: { habitId: string; date: string }) => repo.toggleHabit(habitId, date)),
    createHabit: useDbMutation(repo.createHabit),
    archiveHabit: useDbMutation(repo.archiveHabit),
    createWorkout: useDbMutation(repo.createWorkout),
    deleteWorkout: useDbMutation(repo.deleteWorkout),
    addVideo: useDbMutation(repo.addVideo),
    updateVideo: useDbMutation(({ id, patch }: { id: string; patch: Parameters<typeof repo.updateVideo>[1] }) => repo.updateVideo(id, patch)),
    deleteVideo: useDbMutation(repo.deleteVideo),
    logSleep: useDbMutation(({ date, hours, quality }: { date: string; hours: number; quality: number }) => repo.logSleep(date, hours, quality)),
  }
}
