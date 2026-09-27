import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useToast } from '@/app/toast'
import { Card, CardHeader } from '@/components/common/Card'
import { InlineText } from '@/components/common/InlineText'
import { getAllSettings, setSetting } from '@/db/repositories/settings'
import { useDbMutation, useDbQuery } from '@/hooks/data'
import { cn } from '@/lib/utils'
import { PhotoSlot } from '@/features/photos/PhotoSlot'
import { personal } from '@/config/personal'
import { TEMPLATE_BRAND, type Brand } from './brand'
import '@fontsource/quicksand/500.css'
import '@fontsource/quicksand/700.css'
import '@fontsource-variable/inter'

function useBrand() {
  const { data } = useDbQuery(['settings'], getAllSettings)
  const brand: Brand = { ...TEMPLATE_BRAND, ...personal.brand, ...((data?.brand as Partial<Brand>) ?? {}) }
  const save = useDbMutation((patch: Partial<Brand>) => setSetting('brand', { ...brand, ...patch }))
  return { brand, save: (patch: Partial<Brand>) => save.mutate(patch) }
}

/** White or black text, whichever reads better on the swatch. */
function inkOn(hex: string) {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16)
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.6 ? '#111111' : '#ffffff'
}

function Colors({ brand, save }: ReturnType<typeof useBrand>) {
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [hex, setHex] = useState('#')
  const valid = /^#[0-9a-fA-F]{6}$/.test(hex)
  return (
    <Card className="p-6">
      <CardHeader
        title="Colours"
        action={
          <button onClick={() => setAdding((a) => !a)} className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted" aria-label="Add colour">
            <Plus className="size-3.5" />
          </button>
        }
      />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {brand.colors.map((c, i) => (
          <div key={`${c.hex}-${i}`} className="group/sw relative">
            <button
              onClick={() => {
                void navigator.clipboard?.writeText(c.hex)
                toast(`${c.hex} copied`)
              }}
              className="flex aspect-[4/5] w-full flex-col justify-end rounded-xl p-3 text-left ring-1 ring-border transition-transform hover:-translate-y-0.5"
              style={{ background: c.hex, color: inkOn(c.hex) }}
              title="Copy hex"
            >
              <span className="text-[12.5px] font-medium">{c.name}</span>
              <span className="font-mono text-[11px] uppercase opacity-80">{c.hex}</span>
            </button>
            <button
              onClick={() => save({ colors: brand.colors.filter((_, j) => j !== i) })}
              className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-black/30 text-white opacity-0 transition-opacity group-hover/sw:opacity-100"
              aria-label={`Remove ${c.name}`}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>
      {adding && (
        <form
          className="mt-4 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!valid) return
            save({ colors: [...brand.colors, { name: name.trim() || hex, hex: hex.toLowerCase() }] })
            setName('')
            setHex('#')
            setAdding(false)
          }}
        >
          <span className="size-8 rounded-lg ring-1 ring-border" style={{ background: valid ? hex : 'transparent' }} />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-8 w-36 rounded-lg border border-border bg-transparent px-2.5 text-[13px] outline-none" />
          <input value={hex} onChange={(e) => setHex(e.target.value)} placeholder="#3f5f7d" className="h-8 w-28 rounded-lg border border-border bg-transparent px-2.5 font-mono text-[12.5px] outline-none" />
          <button type="submit" disabled={!valid} className="h-8 rounded-lg bg-foreground px-3 text-[12.5px] text-background disabled:opacity-40">Add</button>
        </form>
      )}
      <p className="mt-3 text-[12px] text-faint">Click a colour to copy its hex.</p>
    </Card>
  )
}

function WordChips({ title, words, onChange, tone }: { title: string; words: string[]; onChange: (w: string[]) => void; tone: 'yes' | 'no' }) {
  const [draft, setDraft] = useState('')
  return (
    <div>
      <div className="mb-2 text-[12px] text-muted-foreground">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {words.map((w) => (
          <button
            key={w}
            onClick={() => onChange(words.filter((x) => x !== w))}
            className={cn('h-7 rounded-full px-3 text-[12.5px] hover:line-through', tone === 'yes' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground line-through decoration-faint hover:no-underline')}
            title="Remove"
          >
            {w}
          </button>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              onChange([...words, draft.trim()])
              setDraft('')
            }
          }}
          placeholder="+ add"
          className="h-7 w-20 bg-transparent text-[12.5px] outline-none placeholder:text-faint"
        />
      </div>
    </div>
  )
}

/** Brand: who the company is — logo, words, colours, type, voice and a moodboard. */
export function StartupBrand() {
  const b = useBrand()
  const { brand, save } = b
  return (
    <div className="flex flex-col gap-5">
      <Card className="grid grid-cols-1 overflow-hidden md:grid-cols-[280px_1fr]">
        <PhotoSlot slot="brand.logo" className="aspect-square w-full md:aspect-auto md:h-full" rounded="rounded-none" placeholder="Add your logo" />
        <div className="flex flex-col justify-center gap-4 p-8">
          <span className="label-caps">Tagline</span>
          <div style={{ fontFamily: brand.fonts[0]?.css }}>
            <InlineText value={brand.tagline} onSave={(v) => save({ tagline: v })} className="text-[38px] leading-[1.1] font-bold tracking-[-0.01em]" />
          </div>
          <InlineText value={brand.description} onSave={(v) => save({ description: v })} className="text-[15px] text-muted-foreground" />
          <div className="mt-2 border-t border-border pt-4">
            <span className="label-caps">Mission</span>
            <InlineText multiline value={brand.mission} onSave={(v) => save({ mission: v })} className="mt-2 text-[15px] leading-relaxed" />
          </div>
        </div>
      </Card>

      <Colors {...b} />

      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 p-6 lg:col-span-6">
          <CardHeader title="Typography" />
          <div className="mt-4 flex flex-col divide-y divide-border">
            {brand.fonts.map((f) => (
              <div key={f.role} className="py-4 first:pt-0">
                <div className="flex items-baseline justify-between text-[12px] text-muted-foreground">
                  <span>{f.role}</span>
                  <span className="font-mono">{f.family}</span>
                </div>
                <div className="mt-2 text-[28px] leading-tight" style={{ fontFamily: f.css, fontWeight: f.role.startsWith('Brand') ? 700 : 400 }}>
                  {brand.tagline}
                </div>
                <div className="mt-1 text-[14px] text-muted-foreground" style={{ fontFamily: f.css }}>
                  Aa Bb Cc · 0123456789 · àèéíòóúç
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="col-span-12 flex flex-col gap-5 p-6 lg:col-span-6">
          <CardHeader title="Voice" />
          <InlineText multiline value={brand.voice} onSave={(v) => save({ voice: v })} className="text-[15px] leading-relaxed" />
          <WordChips title="We say" words={brand.say} onChange={(say) => save({ say })} tone="yes" />
          <WordChips title="We don’t say" words={brand.avoid} onChange={(avoid) => save({ avoid })} tone="no" />
        </Card>
      </div>

      <Card className="p-6">
        <CardHeader title="Moodboard" />
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <PhotoSlot key={i} slot={`brand.mood.${i}`} className="aspect-[4/5] w-full" rounded="rounded-lg" />
          ))}
        </div>
      </Card>
    </div>
  )
}
