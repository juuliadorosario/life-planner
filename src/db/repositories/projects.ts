import { asc, eq } from 'drizzle-orm'
import { db } from '../client'
import { projects, tasks } from '../schema'
import { newId, type Project } from '@/types/domain'

export interface ProjectWithStats extends Project {
  taskCount: number
  doneCount: number
  progress: number
}

export async function listProjects(): Promise<ProjectWithStats[]> {
  const [rows, allTasks] = await Promise.all([
    db().select().from(projects).orderBy(asc(projects.status), asc(projects.createdAt)),
    db().select({ projectId: tasks.projectId, status: tasks.status }).from(tasks),
  ])
  return rows.map((p) => {
    const own = allTasks.filter((t) => t.projectId === p.id)
    const done = own.filter((t) => t.status === 'done').length
    return { ...p, taskCount: own.length, doneCount: done, progress: own.length ? Math.round((done / own.length) * 100) : 0 }
  })
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db().select().from(projects).where(eq(projects.id, id)).get()
}

export async function createProject(input: Omit<typeof projects.$inferInsert, 'id'>): Promise<Project> {
  const [row] = await db().insert(projects).values({ id: newId(), ...input }).returning()
  return row
}

export async function updateProject(id: string, patch: Partial<Omit<Project, 'id'>>): Promise<void> {
  await db().update(projects).set(patch).where(eq(projects.id, id))
}

export async function deleteProject(id: string): Promise<void> {
  await db().delete(projects).where(eq(projects.id, id))
}
