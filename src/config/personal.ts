/**
 * Personal overrides.
 *
 * The public template works on its own. To make it yours, create
 * `src/personal/index.ts` (it is git-ignored) exporting `personal` with any of
 * these fields, and put your photos in `src/personal/photos/`.
 * See `src/personal.example.ts`.
 */
import type { Brand } from '@/features/startup/brand'

export interface Personal {
  /** Shown next to the logo in the sidebar and as the window title. */
  appName: string
  /** `script` writes the name in the handwritten font (used by "jul"). */
  wordmark: 'display' | 'script'
  /** Logo image URL (import it from `src/personal/`). Defaults to the built-in mark. */
  logo: string | null
  /** Pre-filled on first launch. */
  userName: string
  startupName: string
  /** Startup brand shown in Startup → Brand. */
  brand: Partial<Brand>
  /** Which photo fills each slot by default, e.g. `{ 'home.banner.0': 'builtin:coffee' }`. */
  photoSlots: Record<string, string>
  /** Per-photo framing for files in `src/personal/photos/`, keyed by file name. */
  photoOptions: Record<string, { position?: string; fit?: 'cover' | 'contain'; bg?: string }>
  /** Default covers for project cards (photo refs), used in order. */
  projectCovers: string[]
  /** Questions offered in an empty assistant chat. Keep them to questions: a tap must never change anything. */
  assistantSuggestions: string[]
}

export const TEMPLATE: Personal = {
  appName: 'Life Planner',
  wordmark: 'display',
  logo: null,
  userName: '',
  startupName: 'My startup',
  brand: {},
  photoSlots: {},
  photoOptions: {},
  projectCovers: [],
  assistantSuggestions: ['How does my week look?', 'What should I do first today?', 'What is overdue?'],
}

const found = import.meta.glob('../personal/index.ts', { eager: true, import: 'personal' }) as Record<string, Partial<Personal>>

export const personal: Personal = { ...TEMPLATE, ...(Object.values(found)[0] ?? {}) }
