import * as repo from '@/db/repositories/study'
import { useDbMutation, useDbQuery } from '@/hooks/data'

export const useSubjects = () => useDbQuery(['subjects'], repo.listSubjects)
export const useExams = (opts: Parameters<typeof repo.listExams>[0] = {}) => useDbQuery(['exams', opts], () => repo.listExams(opts))
export const useExam = (id: string) => useDbQuery(['exam', id], () => repo.getExam(id))
export const useExamRelations = (id: string) => useDbQuery(['exam-relations', id], () => repo.examRelations(id))
export const useAssignments = (subjectId?: string) => useDbQuery(['assignments', subjectId], () => repo.listAssignments(subjectId))
export const useStudySessions = (opts: Parameters<typeof repo.listStudySessions>[0] = {}) =>
  useDbQuery(['sessions', opts], () => repo.listStudySessions(opts))
export const useStudyMinutes = (days = 7) => useDbQuery(['study-minutes', days], () => repo.studyMinutesBySubject(days))

export function useStudyActions() {
  return {
    createSubject: useDbMutation(repo.createSubject),
    addTopic: useDbMutation(({ subjectId, name }: { subjectId: string; name: string }) => repo.addTopic(subjectId, name)),
    toggleTopic: useDbMutation(({ id, done }: { id: string; done: boolean }) => repo.setTopicDone(id, done)),
    createExam: useDbMutation(repo.createExam),
    setExamDone: useDbMutation(({ id, done }: { id: string; done: boolean }) => repo.setExamDone(id, done)),
    deleteExam: useDbMutation(repo.deleteExam),
    createAssignment: useDbMutation(repo.createAssignment),
    toggleAssignment: useDbMutation(({ id, done }: { id: string; done: boolean }) => repo.setAssignmentDone(id, done)),
    createSession: useDbMutation(repo.createStudySession),
    toggleSession: useDbMutation(({ id, done }: { id: string; done: boolean }) => repo.setStudySessionDone(id, done)),
  }
}
