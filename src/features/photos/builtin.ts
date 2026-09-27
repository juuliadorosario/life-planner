import { personal } from '@/config/personal'

/**
 * Photos bundled with the app: anything in `src/assets/photos/` (template) or
 * `src/personal/photos/` (yours, git-ignored). The file name without extension
 * is the key, referenced from slots as `builtin:<key>`.
 */
const files = {
  ...import.meta.glob('@/assets/photos/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' }),
  ...import.meta.glob('@/personal/photos/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' }),
} as Record<string, string>

export interface BuiltinPhoto {
  src: string
  /** CSS object-position, to keep the subject in frame when cropped. */
  position?: string
  /** `contain` for typographic images that must not be cropped. */
  fit?: 'cover' | 'contain'
  /** Background behind a `contain` image; defaults to white with a margin. */
  bg?: string
}

export const BUILTIN_PHOTOS: Record<string, BuiltinPhoto> = Object.fromEntries(
  Object.entries(files).map(([path, src]) => {
    const key = /\/([^/]+)\.\w+$/.exec(path)![1]
    return [key, { src, ...personal.photoOptions[key] }]
  }),
)

/** What each slot shows until the user changes it; unlisted slots start empty. */
export const DEFAULT_SLOTS: Record<string, string> = personal.photoSlots

/**
 * Default cover for the n-th project (in list order), so neighbouring cards
 * never share a photo and a card and its page agree.
 */
export function defaultCover(index: number, covers: string[]): string | undefined {
  return index < 0 || !covers.length ? undefined : covers[index % covers.length]
}

export const PROJECT_COVERS = personal.projectCovers
