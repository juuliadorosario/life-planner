/**
 * A task's kind lives in its tags, so no migration is needed. Plain tasks carry none of these.
 * - deadline: a fixed date that can't move (shows in "This month" and as Fixed in "This week")
 * - thread:   no date, waiting on someone; reviewed every Friday ("Open threads")
 * - pending:  a fact you still need, like an exam date ("Pending info")
 */
export const TASK_KINDS = [
  { id: 'deadline', name: 'Deadline' },
  { id: 'thread', name: 'Open thread' },
  { id: 'pending', name: 'Pending info' },
] as const

export type TaskKind = (typeof TASK_KINDS)[number]['id']

export function kindOf(tags: string[]): TaskKind | null {
  return TASK_KINDS.find((k) => tags.includes(k.id))?.id ?? null
}

/** Replace whatever kind the tags had with `kind` (or none), keeping other tags. */
export function withKind(tags: string[], kind: string | null): string[] {
  const rest = tags.filter((t) => !TASK_KINDS.some((k) => k.id === t))
  return kind ? [...rest, kind] : rest
}
