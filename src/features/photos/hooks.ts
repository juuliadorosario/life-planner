import { assignSlot, getSlots, listPhotos, setSlotPhoto } from '@/db/repositories/photos'
import { useDbMutation, useDbQuery } from '@/hooks/data'
import { BUILTIN_PHOTOS, DEFAULT_SLOTS } from './builtin'

export interface ResolvedPhoto {
  src: string
  position?: string
  fit?: 'cover' | 'contain'
  bg?: string
}

/** Resolve slot names to image sources (user choice → default → empty). */
export function usePhotoSlots() {
  const { data: slots = {} } = useDbQuery(['photo-slots'], getSlots)
  const { data: photos = [] } = useDbQuery(['photos'], listPhotos)
  const resolve = (slot: string, fallback?: string): ResolvedPhoto | null => {
    const ref = slot in slots ? slots[slot] : (DEFAULT_SLOTS[slot] ?? fallback)
    if (!ref) return null
    if (ref.startsWith('builtin:')) return BUILTIN_PHOTOS[ref.slice(8)] ?? null
    const photo = photos.find((p) => p.id === ref)
    return photo ? { src: photo.data } : null
  }
  return { resolve }
}

export function usePhotoActions() {
  return {
    upload: useDbMutation(({ slot, dataUrl, name }: { slot: string; dataUrl: string; name?: string }) => setSlotPhoto(slot, dataUrl, name)),
    clear: useDbMutation((slot: string) => assignSlot(slot, null)),
  }
}
