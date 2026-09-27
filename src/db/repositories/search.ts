import { like, or } from 'drizzle-orm'
import { db } from '../client'
import { exams, goals, links, notes, projects, subjects, tasks } from '../schema'
import type { EntityType } from '@/types/domain'

export interface SearchResult {
  type: EntityType
  id: string
  title: string
  /** Short context: the subject, project or date it belongs to. */
  context?: string
  href: string
}

/** Search every kind of object at once. Local and fast — no index needed at this size. */
export async function searchEverything(query: string, limitPerType = 5): Promise<SearchResult[]> {
  const q = `%${query.trim()}%`
  if (q === '%%') return []
  const [taskRows, noteRows, projectRows, subjectRows, examRows, goalRows, linkRows, allSubjects, allProjects] = await Promise.all([
    db().select().from(tasks).where(or(like(tasks.title, q), like(tasks.description, q))).limit(limitPerType),
    db().select().from(notes).where(or(like(notes.title, q), like(notes.contentText, q))).limit(limitPerType),
    db().select().from(projects).where(or(like(projects.name, q), like(projects.description, q))).limit(limitPerType),
    db().select().from(subjects).where(like(subjects.name, q)).limit(limitPerType),
    db().select().from(exams).where(or(like(exams.title, q), like(exams.description, q))).limit(limitPerType),
    db().select().from(goals).where(or(like(goals.title, q), like(goals.description, q))).limit(limitPerType),
    db().select().from(links).where(or(like(links.title, q), like(links.url, q))).limit(limitPerType),
    db().select({ id: subjects.id, name: subjects.name }).from(subjects),
    db().select({ id: projects.id, name: projects.name }).from(projects),
  ])
  const subjectName = (id: string | null) => allSubjects.find((s) => s.id === id)?.name
  const projectName = (id: string | null) => allProjects.find((p) => p.id === id)?.name

  return [
    ...noteRows.map((n) => ({ type: 'note' as const, id: n.id, title: n.title || 'Untitled', context: subjectName(n.subjectId) ?? projectName(n.projectId) ?? n.folder ?? undefined, href: `/notes/${n.id}` })),
    ...examRows.map((e) => ({ type: 'exam' as const, id: e.id, title: e.title, context: e.date, href: `/study/exams/${e.id}` })),
    ...taskRows.map((t) => ({ type: 'task' as const, id: t.id, title: t.title, context: subjectName(t.subjectId) ?? projectName(t.projectId) ?? (t.status === 'done' ? 'Completed' : undefined), href: `/tasks?task=${t.id}` })),
    ...projectRows.map((p) => ({ type: 'project' as const, id: p.id, title: p.name, context: p.status, href: `/projects/${p.id}` })),
    ...subjectRows.map((s) => ({ type: 'subject' as const, id: s.id, title: s.name, context: 'Subject', href: `/study/subjects/${s.id}` })),
    ...goalRows.map((g) => ({ type: 'goal' as const, id: g.id, title: g.title, context: g.deadline ?? undefined, href: `/goals/${g.id}` })),
    ...linkRows.map((l) => ({ type: 'link' as const, id: l.id, title: l.title, context: l.url.replace(/^https?:\/\//, ''), href: l.url })),
  ]
}
