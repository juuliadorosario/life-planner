/**
 * Make Life Planner yours.
 *
 * 1. Create the folder `src/personal/` (git-ignored).
 * 2. Copy this file to `src/personal/index.ts` and fill in what you want.
 * 3. Drop photos into `src/personal/photos/` — the file name (without
 *    extension) becomes its key: `photos/beach.jpg` → `'builtin:beach'`.
 * 4. Optional: your own app name and icon for the Mac build — see README.
 */
import type { Personal } from '@/config/personal'
// import logo from './logo.png'

export const personal: Partial<Personal> = {
  appName: 'Life Planner',
  // wordmark: 'script', // write the name in the handwritten font
  // logo,
  userName: 'Alex',
  startupName: 'My startup',

  // Which photo fills each slot by default. Slots: home.banner.0–5, home.portrait,
  // home.book, today|study|startup|health.banner.0–4, finance|goals|projects.banner.0–3,
  // brand.logo, brand.mood.0–5.
  photoSlots: {
    // 'home.banner.0': 'builtin:beach',
  },
  // Framing for a photo that gets cropped badly: CSS object-position, or `contain`.
  photoOptions: {
    // beach: { position: '50% 70%' },
  },
  projectCovers: [],
  brand: {
    // tagline: 'Your one-line promise.',
  },
}
