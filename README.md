# Life Planner

A calm, local-first personal dashboard for your Mac. Your day, tasks, studies, startup, health, money and notes in one place — connected to each other, stored on your own computer, working offline.

- **Home** — a photo moodboard, today's plan, tasks, habits, upcoming exams and a customizable widget grid.
- **Today** — a timeline of your day with tasks, habits and what's important this week.
- **Calendar** — month, week, day and agenda views. Shows your **Apple Calendar** (iCloud, Google, Exchange…) next to your exams and study sessions.
- **Study** — subjects with topics and progress, exams that generate a study plan, assignments and study sessions.
- **Startup** — revenue, MRR and burn with charts, a task board, marketing (channel numbers + content pipeline) and a brand page (colours, type, voice, moodboard).
- **Health** — habits, sleep, and a **pilates / workout video library**: paste a YouTube link, tap *Done* when you finish.
- **Finance** — budget by category, savings rate and spending pace.
- **Notes, Projects, Goals** — rich notes with `[[links]]` and backlinks; everything links to everything.
- **Spotify** — what's playing on your Mac, with play/pause/skip (no account or Premium needed).
- **⌘K** command palette and **⌘⇧Space** quick capture.

Built with Tauri 2, React, TypeScript, Tailwind and SQLite (Drizzle). No cloud, no account: your data is one SQLite file in `~/Library/Application Support/app.lifeplanner.desktop/`.

## Install

Requirements: **macOS 14+**, [Node.js 20+](https://nodejs.org) and [Rust](https://rustup.rs).

```bash
# 1. Get the code
git clone https://github.com/juuliadorosario/life-planner.git
cd life-planner

# 2. Install dependencies
npm install

# 3. Try it (opens the app with live reload)
npm run desktop

# 4. Build the real app
npm run desktop:build
```

The app is created at `src-tauri/target/release/bundle/macos/Life Planner.app`. Drag it into **Applications**.

Because it isn't signed with an Apple Developer certificate, macOS may block it the first time: right-click the app → **Open** → **Open**.

The first time you use them, macOS asks for permission:

- **Calendar** — to show Apple Calendar events (Settings → Integrations → Connect).
- **Spotify** — to read what's playing and control playback ("… wants to control Spotify").

You can also run it in a browser for a quick look (`npm run dev` → http://localhost:1420). In the browser, data lives in the browser's storage and Spotify/Apple Calendar are replaced by demos.

## Make it yours

The app starts with demo data so it doesn't look empty. When you're ready, clear it with *Settings → Data → Remove demo content* and fill in your own.

For photos, your name and your own app name/icon, use a personal folder. It's git-ignored, so you can keep pulling updates without mixing in your stuff:

1. Create `src/personal/` and copy `src/personal.example.ts` to `src/personal/index.ts`.
2. Put photos in `src/personal/photos/` and point slots at them (`'home.banner.0': 'builtin:beach'` for `photos/beach.jpg`). Photos can also be added from inside the app — hover any photo space.
3. Optional — your own app name and icon for the Mac build:
   - `npx tauri icon my-icon.png --output src-tauri/icons-personal` (a 1024×1024 PNG).
   - Create `src-tauri/tauri.personal.conf.json`:
     ```json
     {
       "productName": "My Planner",
       "identifier": "com.me.planner",
       "app": { "windows": [{ "label": "main", "title": "My Planner", "width": 1440, "height": 920, "minWidth": 960, "minHeight": 640, "titleBarStyle": "Overlay", "hiddenTitle": true, "trafficLightPosition": { "x": 18, "y": 22 } }] },
       "bundle": { "icon": ["icons-personal/32x32.png", "icons-personal/128x128.png", "icons-personal/128x128@2x.png", "icons-personal/icon.icns", "icons-personal/icon.ico"] }
     }
     ```
   - Build with `npm run desktop:build:personal`.

## How it's built

```
src/
  app/          App shell: providers, router, theme, toasts
  components/   Shared UI (cards, charts, photo slots, shadcn/ui)
  config/       Template defaults + personal overrides
  db/           SQLite schema (Drizzle), migrations, seed, repositories
  features/     One folder per area: dashboard, today, tasks, calendar, study,
                startup, health, finance, notes, projects, goals, search, settings
  providers/    Integrations behind interfaces: storage, calendar, spotify, ai
src-tauri/      The macOS app: SQLite, Spotify (AppleScript), Apple Calendar (EventKit)
```

Integrations sit behind small interfaces (`CalendarProvider`, `SpotifyProvider`, `StorageProvider`, `AIProvider`), so adding Google Calendar or the Spotify Web API doesn't touch the UI.

Useful commands: `npm run desktop` (dev app), `npm run build` (type-check + web build), `npx drizzle-kit generate` (after changing `src/db/schema.ts`; migrations run automatically on launch).

## License

MIT
