import { asc, eq } from 'drizzle-orm'
import { db } from '../client'
import { dashboardWidgets } from '../schema'
import { DEFAULT_WIDGETS } from '../defaultWidgets'
import { newId, type DashboardWidget } from '@/types/domain'

export async function listWidgets(): Promise<DashboardWidget[]> {
  return db().select().from(dashboardWidgets).orderBy(asc(dashboardWidgets.position))
}

export async function updateWidget(id: string, patch: Partial<Omit<DashboardWidget, 'id'>>): Promise<void> {
  await db().update(dashboardWidgets).set(patch).where(eq(dashboardWidgets.id, id))
}

/** Persist a new order: `ids` is the full list, first to last. */
export async function reorderWidgets(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id, position) => updateWidget(id, { position })))
}

export async function addWidget(type: string, size: DashboardWidget['size']): Promise<void> {
  const existing = await listWidgets()
  const hidden = existing.find((w) => w.type === type && !w.visible)
  const position = existing.length ? Math.max(...existing.map((w) => w.position)) + 1 : 0
  if (hidden) await updateWidget(hidden.id, { visible: true, position })
  else await db().insert(dashboardWidgets).values({ id: newId(), type, size, position, visible: true })
}

export async function resetWidgets(): Promise<void> {
  await db().delete(dashboardWidgets)
  await db().insert(dashboardWidgets).values(DEFAULT_WIDGETS.map((w, i) => ({ id: newId(), position: i, ...w })))
}
