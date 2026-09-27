import { useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CalendarDays, Check, GraduationCap, HeartPulse, Music, Rocket, Wallet, type LucideIcon } from 'lucide-react'
import { LogoMark } from '@/components/layout/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { personal } from '@/config/personal'
import { startEmpty } from '@/db/repositories/cleanup'
import { setSetting } from '@/db/repositories/settings'
import { createLink } from '@/db/repositories/startup'
import { useAppleCalendar } from '@/features/calendar/hooks'
import { PhotoSlot } from '@/features/photos/PhotoSlot'
import { usePlayback } from '@/features/spotify/usePlayback'
import { useSettings } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'
import { AppleCalendarProvider } from '@/providers/calendar'

const AREAS: { id: string; label: string; hint: string; icon: LucideIcon }[] = [
  { id: 'study', label: 'Study', hint: 'Subjects, exams, assignments', icon: GraduationCap },
  { id: 'startup', label: 'Startup', hint: 'Metrics, marketing, brand', icon: Rocket },
  { id: 'health', label: 'Health', hint: 'Habits, workouts, sleep', icon: HeartPulse },
  { id: 'finance', label: 'Finance', hint: 'Budget and spending', icon: Wallet },
]

const STEPS = ['welcome', 'areas', 'photos', 'connect', 'start'] as const
type Step = (typeof STEPS)[number]

function Title({ eyebrow, children, sub }: { eyebrow: string; children: ReactNode; sub?: string }) {
  return (
    <div className="mb-7">
      <div className="mb-2 label-caps">{eyebrow}</div>
      <h2 className="display text-[30px] leading-[1.1]">{children}</h2>
      {sub && <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{sub}</p>}
    </div>
  )
}

function ConnectRow({ icon: Icon, title, status, ok, action }: { icon: LucideIcon; title: string; status: string; ok: boolean; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border p-4">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium">{title}</div>
        <div className={cn('text-[12.5px]', ok ? 'text-primary' : 'text-muted-foreground')}>{status}</div>
      </div>
      {ok ? <Check className="size-4 text-primary" /> : action}
    </div>
  )
}

/**
 * First-run setup: name, areas, photos, integrations and how to start.
 * Every step can be skipped; everything can be changed later in Settings.
 */
export function Onboarding({ onClose }: { onClose: () => void }) {
  const settings = useSettings()
  const qc = useQueryClient()
  const apple = useAppleCalendar()
  const { state: playback, provider: spotify } = usePlayback()
  const [step, setStep] = useState<Step>('welcome')
  const [name, setName] = useState(settings.userName)
  const [areas, setAreas] = useState<string[]>(AREAS.map((a) => a.id).filter((id) => !settings.hiddenAreas.includes(id)))
  const [startupName, setStartupName] = useState(settings.startupName === 'My startup' ? '' : settings.startupName)
  const [links, setLinks] = useState({ website: '', instagram: '', linkedin: '' })
  const [emptyStart, setEmptyStart] = useState(false)
  const [busy, setBusy] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const index = STEPS.indexOf(step)
  const next = () => setStep(STEPS[Math.min(index + 1, STEPS.length - 1)])
  const back = () => setStep(STEPS[Math.max(index - 1, 0)])

  const finish = async () => {
    setBusy(true)
    try {
      if (emptyStart) await startEmpty({ removeSubjects: true })
      await setSetting('userName', name.trim())
      await setSetting('hiddenAreas', AREAS.map((a) => a.id).filter((id) => !areas.includes(id)))
      if (areas.includes('startup') && startupName.trim()) await setSetting('startupName', startupName.trim())
      const urls = [
        { title: 'Website', url: links.website, icon: 'globe' },
        { title: 'Instagram', url: links.instagram, icon: null },
        { title: 'LinkedIn', url: links.linkedin, icon: null },
      ].filter((l) => l.url.trim())
      for (const l of urls) {
        const full = /^https?:\/\//.test(l.url.trim()) ? l.url.trim() : `https://${l.url.trim()}`
        await createLink({ title: l.title, url: full, collection: 'startup', icon: l.icon })
      }
      await setSetting('onboarded', new Date().toISOString())
      await qc.invalidateQueries()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const spotifyStatus =
    spotify.id === 'mock'
      ? { ok: false, text: 'Available in the desktop app' }
      : playback?.status === 'playing' || playback?.status === 'paused' || playback?.status === 'stopped'
        ? { ok: true, text: 'Connected to the Spotify app on this Mac' }
        : playback?.status === 'unavailable'
          ? { ok: false, text: 'Allow it in System Settings → Privacy & Security → Automation' }
          : { ok: false, text: 'Open Spotify on your Mac — no account or Premium needed' }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-background/80 p-6 backdrop-blur-md">
      <div className="animate-page w-full max-w-[600px] rounded-2xl border border-border bg-card p-8 shadow-float md:p-10">
        <div className="mb-8 flex items-center justify-between">
          <LogoMark className="size-7" />
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <span key={s} className={cn('h-1 rounded-full transition-all', i === index ? 'w-6 bg-foreground' : i < index ? 'w-3 bg-foreground/40' : 'w-3 bg-muted')} />
            ))}
          </div>
          <button onClick={() => void finish()} className="text-[12.5px] text-muted-foreground hover:text-foreground">
            Skip setup
          </button>
        </div>

        {step === 'welcome' && (
          <>
            <Title eyebrow={`Welcome to ${personal.appName}`} sub="Your day, studies, projects, health and money — in one calm place that lives on your Mac.">
              Let’s make it yours.
            </Title>
            <label className="flex flex-col gap-2">
              <span className="text-[13px] text-muted-foreground">What should we call you?</span>
              <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-11 text-[15px]" onKeyDown={(e) => e.key === 'Enter' && next()} />
            </label>
          </>
        )}

        {step === 'areas' && (
          <>
            <Title eyebrow="What you’re juggling" sub="Pick what you use. The rest stays out of your menu — you can bring it back in Settings.">
              What do you want to track?
            </Title>
            <div className="grid grid-cols-2 gap-3">
              {AREAS.map((a) => {
                const on = areas.includes(a.id)
                return (
                  <button
                    key={a.id}
                    onClick={() => setAreas(on ? areas.filter((x) => x !== a.id) : [...areas, a.id])}
                    className={cn('flex items-start gap-3 rounded-xl border p-4 text-left transition-colors', on ? 'border-foreground bg-muted/40' : 'border-border hover:border-border-strong')}
                  >
                    <a.icon className={cn('mt-0.5 size-4', on ? 'text-foreground' : 'text-muted-foreground')} strokeWidth={1.75} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-medium">{a.label}</span>
                      <span className="block text-[12.5px] text-muted-foreground">{a.hint}</span>
                    </span>
                    <span className={cn('grid size-4 place-items-center rounded-full border', on ? 'border-foreground bg-foreground text-background' : 'border-border-strong')}>{on && <Check className="size-2.5" strokeWidth={3} />}</span>
                  </button>
                )
              })}
            </div>
            {areas.includes('startup') && (
              <label className="mt-5 flex flex-col gap-2">
                <span className="text-[13px] text-muted-foreground">Your startup’s name</span>
                <Input value={startupName} onChange={(e) => setStartupName(e.target.value)} placeholder="Acme" className="h-10" />
              </label>
            )}
          </>
        )}

        {step === 'photos' && (
          <>
            <Title eyebrow="Make it feel like you" sub="A photo of you and a few that inspire you. Click a space or drop an image on it — you can add more anywhere later.">
              Your photos
            </Title>
            <div className="flex items-center gap-6">
              <PhotoSlot slot="home.portrait" className="size-32 shrink-0" rounded="rounded-full" placeholder="You" />
              <div className="grid flex-1 grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <PhotoSlot key={i} slot={`home.banner.${i}`} className="aspect-[4/5] w-full" rounded="rounded-lg" compact />
                ))}
              </div>
            </div>
          </>
        )}

        {step === 'connect' && (
          <>
            <Title eyebrow="Bring your life in" sub="Optional — everything works offline without them.">
              Connect your things
            </Title>
            <div className="flex flex-col gap-3">
              <ConnectRow
                icon={CalendarDays}
                title="Apple Calendar"
                ok={apple.status === 'full'}
                status={!apple.available ? 'Available in the desktop app' : apple.status === 'full' ? `Connected · ${apple.calendars.length} calendars` : apple.status === 'denied' ? 'Declined — enable it in System Settings → Privacy & Security → Calendars' : 'iCloud, Google and every calendar on your Mac'}
                action={
                  apple.available && apple.status !== 'denied' ? (
                    <Button
                      size="sm"
                      disabled={connecting}
                      onClick={async () => {
                        setConnecting(true)
                        await AppleCalendarProvider.requestAccess().catch(() => false)
                        await qc.invalidateQueries()
                        setConnecting(false)
                      }}
                    >
                      {connecting ? 'Waiting…' : 'Connect'}
                    </Button>
                  ) : undefined
                }
              />
              <ConnectRow icon={Music} title="Spotify" ok={spotifyStatus.ok} status={spotifyStatus.text} />
              {areas.includes('startup') && (
                <div className="rounded-xl border border-border p-4">
                  <div className="mb-3 text-[14px] font-medium">{startupName.trim() || 'Your startup'}’s links</div>
                  <div className="grid grid-cols-1 gap-2">
                    {(['website', 'instagram', 'linkedin'] as const).map((k) => (
                      <Input key={k} value={links[k]} onChange={(e) => setLinks({ ...links, [k]: e.target.value })} placeholder={k === 'website' ? 'yourstartup.com' : k === 'instagram' ? 'instagram.com/yourstartup' : 'linkedin.com/company/yourstartup'} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {step === 'start' && (
          <>
            <Title eyebrow="Almost there" sub="You can switch any time in Settings → Data.">
              How do you want to start?
            </Title>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { empty: false, title: 'Explore first', text: 'Keep the example tasks, exams and numbers to see how everything connects.' },
                { empty: true, title: 'Start empty', text: 'A clean slate: add your own subjects, tasks, goals and habits.' },
              ].map((o) => (
                <button
                  key={o.title}
                  onClick={() => setEmptyStart(o.empty)}
                  className={cn('rounded-xl border p-4 text-left transition-colors', emptyStart === o.empty ? 'border-foreground bg-muted/40' : 'border-border hover:border-border-strong')}
                >
                  <div className="text-[14px] font-medium">{o.title}</div>
                  <div className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{o.text}</div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-9 flex items-center justify-between">
          {index > 0 ? (
            <Button variant="ghost" onClick={back}>
              <ArrowLeft /> Back
            </Button>
          ) : (
            <span />
          )}
          {step === 'start' ? (
            <Button onClick={() => void finish()} disabled={busy}>
              {busy ? 'Setting up…' : `Open ${personal.appName}`} <ArrowRight />
            </Button>
          ) : (
            <Button onClick={next}>
              {step === 'photos' || step === 'connect' ? 'Next' : 'Continue'} <ArrowRight />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
