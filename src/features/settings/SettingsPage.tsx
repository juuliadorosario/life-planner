import { useState, type ReactNode } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemeMode } from '@/app/theme'
import { useToast } from '@/app/toast'
import { Card } from '@/components/common/Card'
import { Kbd } from '@/components/common/Kbd'
import { Page, PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { AppleCalendarSettings } from '@/features/calendar/AppleCalendarConnect'
import { COVER_STYLES, type CoverStyle } from '@/features/study/SubjectCover'
import { getStorage, resetDatabase } from '@/db/client'
import { startEmpty } from '@/db/repositories/cleanup'
import { queryClient } from '@/hooks/data'
import { useSetSetting, useSettings } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'
import { aiProvider } from '@/providers/ai/AIProvider'
import { calendarService } from '@/providers/calendar'
import { getSpotifyProvider } from '@/providers/spotify'
import { personal } from '@/config/personal'

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-4 border-b border-border py-8 first:pt-0 last:border-0 md:grid-cols-[220px_1fr]">
      <div>
        <h2 className="text-[14px] font-medium">{title}</h2>
        {description && <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13.5px]">{label}</span>
      {children}
    </div>
  )
}

function Status({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]', on ? 'bg-primary-soft text-primary' : 'bg-muted text-muted-foreground')}>
      <span className={cn('size-1.5 rounded-full', on ? 'bg-primary' : 'bg-faint')} />
      {children}
    </span>
  )
}

function TextSetting({ settingKey, value, placeholder }: { settingKey: 'userName' | 'startupName'; value: string; placeholder: string }) {
  const set = useSetSetting()
  const [draft, setDraft] = useState(value)
  return <Input className="w-56" value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onBlur={() => draft !== value && set.mutate({ key: settingKey, value: draft.trim() })} />
}

export function SettingsPage() {
  const settings = useSettings()
  const set = useSetSetting()
  const { mode, setMode, photosMono, setPhotosMono, accent, setAccent } = useTheme()
  const toast = useToast()
  const storage = getStorage()
  const spotify = getSpotifyProvider()
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const [countdown, setCountdown] = useState(settings.countdown ?? { title: '', date: '' })

  const exportBackup = async () => {
    const bytes = await storage.exportBytes?.()
    if (!bytes) return
    const url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: 'application/x-sqlite3' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `lifeos-${new Date().toISOString().slice(0, 10)}.db`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Page>
      <PageHeader eyebrow="Settings" title="Preferences" />
      <Card className="px-8 py-8">
        <Section title="Profile">
          <Row label="Your name"><TextSetting settingKey="userName" value={settings.userName} placeholder="Name" /></Row>
          <Row label="Startup name"><TextSetting settingKey="startupName" value={settings.startupName} placeholder="Startup" /></Row>
          <Row label="Currency">
            <div className="flex rounded-lg bg-muted p-0.5">
              {['EUR', 'USD', 'GBP'].map((c) => (
                <button key={c} onClick={() => set.mutate({ key: 'currency', value: c })} className={cn('h-7 rounded-md px-3 text-[12.5px]', settings.currency === c ? 'bg-card font-medium shadow-card' : 'text-muted-foreground')}>
                  {c}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        <Section title="Appearance" description="System follows your Mac's light or dark setting.">
          <div className="grid grid-cols-3 gap-3">
            {([
              ['light', 'Light', Sun],
              ['dark', 'Dark', Moon],
              ['system', 'System', Monitor],
            ] as [ThemeMode, string, typeof Sun][]).map(([m, label, Icon]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn('flex flex-col items-center gap-2 rounded-xl border p-4 text-[13px] transition-colors', mode === m ? 'border-primary/50 bg-primary-soft text-primary' : 'border-border text-muted-foreground hover:border-border-strong hover:text-foreground')}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {label}
              </button>
            ))}
          </div>
          <Row label="Accent">
            <div className="flex rounded-lg bg-muted p-0.5">
              {([
                ['black', 'Black', '#111111'],
                ['camel', 'Camel', '#b08968'],
              ] as const).map(([id, label, color]) => (
                <button key={id} onClick={() => setAccent(id)} className={cn('flex h-7 items-center gap-2 rounded-md px-3 text-[12.5px]', accent === id ? 'bg-card font-medium shadow-card' : 'text-muted-foreground')}>
                  <span className="size-2.5 rounded-full" style={{ background: color }} />
                  {label}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Photos in black & white">
            <Switch checked={photosMono} onCheckedChange={setPhotosMono} />
          </Row>
          <Row label="Subject covers">
            <div className="flex gap-2">
              {(Object.keys(COVER_STYLES) as CoverStyle[]).map((k) => (
                <button
                  key={k}
                  onClick={() => set.mutate({ key: 'coverStyle', value: k })}
                  className={cn('flex flex-col items-center gap-1.5 rounded-lg p-1 text-[11.5px]', settings.coverStyle === k ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
                  aria-pressed={settings.coverStyle === k}
                >
                  <span
                    className={cn('grid h-9 w-14 place-items-center rounded-md ring-offset-2 ring-offset-card', settings.coverStyle === k && 'ring-2 ring-foreground')}
                    style={{ background: COVER_STYLES[k].bg }}
                  >
                    <span className="script text-[15px] text-white">Aa</span>
                  </span>
                  {COVER_STYLES[k].label}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        <Section title="Countdown" description="Shown in the Countdown widget. Leave empty to count down to your next exam.">
          <div className="flex flex-wrap gap-2">
            <Input className="w-56" placeholder="Summer holidays" value={countdown.title} onChange={(e) => setCountdown({ ...countdown, title: e.target.value })} />
            <Input className="w-40" type="date" value={countdown.date} onChange={(e) => setCountdown({ ...countdown, date: e.target.value })} />
            <Button variant="outline" onClick={() => { set.mutate({ key: 'countdown', value: countdown.title && countdown.date ? countdown : null }); toast('Countdown saved') }}>Save</Button>
          </div>
        </Section>

        <Section title="Integrations" description={`${personal.appName} works fully offline. Integrations are optional and plug into the same interfaces.`}>
          <Row label="Calendar sources">
            <span className="text-[12.5px] text-muted-foreground">{calendarService.list().map((p) => p.name).join(', ')}</span>
          </Row>
          <div className="flex flex-col gap-2">
            <span className="text-[13.5px]">Apple Calendar</span>
            <AppleCalendarSettings />
          </div>
          <Row label="Spotify"><Status on={spotify.id !== 'mock'}>{spotify.id !== 'mock' ? 'Spotify app on this Mac' : 'Demo player (browser)'}</Status></Row>
          <Row label="AI assistant"><Status on={aiProvider.available}>{aiProvider.available ? 'Ready' : 'Not configured'}</Status></Row>
        </Section>

        <Section title="Data" description="Your data lives on this device, in a single SQLite database.">
          <Row label="Location"><code className="rounded-md bg-muted px-2 py-1 text-[12px]">{storage.location}</code></Row>
          <Row label="Backup">
            <Button variant="outline" size="sm" onClick={exportBackup} disabled={!storage.exportBytes}>Export database</Button>
          </Row>
          <Row label="Start empty">
            {confirmEmpty ? (
              <span className="flex items-center gap-2">
                <span className="text-[12.5px] text-muted-foreground">Deletes all tasks, notes, goals, projects, exams, habits and numbers.</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirmEmpty(false)}>Cancel</Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    await startEmpty()
                    await queryClient.invalidateQueries()
                    setConfirmEmpty(false)
                    toast('Clean slate — make it yours')
                  }}
                >
                  Delete everything
                </Button>
              </span>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setConfirmEmpty(true)}>Remove demo content</Button>
            )}
          </Row>
          <Row label="Demo data">
            {confirmReset ? (
              <span className="flex items-center gap-2">
                <span className="text-[12.5px] text-muted-foreground">This erases everything.</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>Cancel</Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    await resetDatabase()
                    await queryClient.invalidateQueries()
                    setConfirmReset(false)
                    toast('Demo data restored')
                  }}
                >
                  Reset
                </Button>
              </span>
            ) : (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setConfirmReset(true)}>Reset to demo data</Button>
            )}
          </Row>
        </Section>

        <Section title="Keyboard">
          {[
            ['Command palette', '⌘K'],
            ['Quick capture', '⌘⇧Space'],
            ['New task (or note in Notes)', 'N'],
            ['Search', '/'],
            ['Toggle sidebar', '⌘\\'],
          ].map(([label, key]) => (
            <Row key={label} label={label}><Kbd className="px-2">{key}</Kbd></Row>
          ))}
        </Section>
      </Card>
    </Page>
  )
}
