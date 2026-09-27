import { listLinkTargets, type LinkTargets } from '@/db/repositories/lookups'
import { useDbQuery } from '@/hooks/data'

const EMPTY: LinkTargets = { areas: [], projects: [], subjects: [], goals: [], exams: [] }

/** Projects, subjects, goals, exams and areas — for pickers and chips. */
export function useLinkTargets(): LinkTargets & { nameOf: (kind: keyof LinkTargets, id?: string | null) => string | undefined } {
  const { data = EMPTY } = useDbQuery(['targets'], listLinkTargets)
  return {
    ...data,
    nameOf: (kind, id) => (id ? data[kind].find((x) => x.id === id)?.name : undefined),
  }
}
