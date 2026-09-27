import type { StorageProvider } from '@/providers/storage/StorageProvider'

// Drizzle-kit writes one .sql file per migration; they are bundled as strings.
const files = import.meta.glob('./migrations/*.sql', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

export async function runMigrations(storage: StorageProvider): Promise<void> {
  await storage.exec('CREATE TABLE IF NOT EXISTS __migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)')
  const { rows } = await storage.query('SELECT name FROM __migrations', [], 'all')
  const applied = new Set((rows as unknown[][]).map((r) => String(r[0])))

  for (const path of Object.keys(files).sort()) {
    const name = path.split('/').pop()!
    if (applied.has(name)) continue
    const statements = files[path].split('--> statement-breakpoint')
    for (const statement of statements) {
      if (statement.trim()) await storage.query(statement, [], 'run')
    }
    await storage.query('INSERT INTO __migrations (name, applied_at) VALUES (?, ?)', [name, new Date().toISOString()], 'run')
  }
}
