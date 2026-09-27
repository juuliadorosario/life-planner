import { eq } from 'drizzle-orm'
import { db } from '../client'
import { photos } from '../schema'
import { getSetting, setSetting } from './settings'
import { newId } from '@/types/domain'

/** Which photo fills each named slot, e.g. `home.banner.2` → `builtin:entrance` or a photo id. */
export type PhotoSlots = Record<string, string | null>

export async function listPhotos() {
  return db().select().from(photos)
}

export async function getSlots(): Promise<PhotoSlots> {
  return (await getSetting<PhotoSlots>('photoSlots')) ?? {}
}

/** Store a new photo and put it in `slot`. */
export async function setSlotPhoto(slot: string, dataUrl: string, name?: string): Promise<void> {
  const id = newId()
  await db().insert(photos).values({ id, data: dataUrl, name: name ?? null })
  await assignSlot(slot, id)
}

/** Point a slot at an existing photo, or `null` to leave it empty. */
export async function assignSlot(slot: string, ref: string | null): Promise<void> {
  const slots = await getSlots()
  const previous = slots[slot]
  await setSetting('photoSlots', { ...slots, [slot]: ref })
  // Drop uploaded photos nobody uses any more.
  if (previous && !previous.startsWith('builtin:')) {
    const stillUsed = Object.entries({ ...slots, [slot]: ref }).some(([, r]) => r === previous)
    if (!stillUsed) await db().delete(photos).where(eq(photos.id, previous))
  }
}
