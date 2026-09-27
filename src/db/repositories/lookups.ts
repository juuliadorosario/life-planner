import { asc } from 'drizzle-orm'
import { db } from '../client'
import { areas, exams, goals, projects, subjects } from '../schema'

/** Everything a picker needs to attach an object to something else. */
export async function listLinkTargets() {
  const [areaRows, projectRows, subjectRows, goalRows, examRows] = await Promise.all([
    db().select().from(areas).orderBy(asc(areas.sortOrder)),
    db().select({ id: projects.id, name: projects.name, areaId: projects.areaId, status: projects.status }).from(projects),
    db().select({ id: subjects.id, name: subjects.name }).from(subjects).orderBy(asc(subjects.sortOrder)),
    db().select({ id: goals.id, name: goals.title, areaId: goals.areaId }).from(goals),
    db().select({ id: exams.id, name: exams.title, subjectId: exams.subjectId, date: exams.date, status: exams.status }).from(exams).orderBy(asc(exams.date)),
  ])
  return { areas: areaRows, projects: projectRows, subjects: subjectRows, goals: goalRows, exams: examRows }
}

export type LinkTargets = Awaited<ReturnType<typeof listLinkTargets>>
