import { useEffect, useMemo, useRef, useState } from 'react'
import type Anthropic from '@anthropic-ai/sdk'
import { ArrowUp, Check, Eye, Sparkles, SquarePen, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useHotkeys } from '@/hooks/useHotkeys'
import { useSetSetting, useSettings } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'
import { runAssistant } from '@/providers/ai/assistant'

type Item =
  | { type: 'user' | 'assistant' | 'error'; text: string }
  /** Something the assistant looked at or changed, shown as a quiet line. */
  | { type: 'activity'; kind: 'read' | 'write'; text: string }

// Only questions: a tap on one of these must never change anything.
const SUGGESTIONS = ['Com tinc la setmana?', 'Què hauria de fer avui primer?', 'Què tinc endarrerit?']

/** ⌘J — a chat with the assistant, floating over whatever page you are on. */
export function Assistant() {
  const { aiApiKey } = useSettings()
  const setSetting = useSetSetting()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [draft, setDraft] = useState('')
  const [keyDraft, setKeyDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<{ summary: string; answer: (ok: boolean) => void } | null>(null)
  // What is sent to Claude each turn; `items` is only what is drawn.
  const history = useRef<Anthropic.MessageParam[]>([])
  const abort = useRef<AbortController | null>(null)
  const bottom = useRef<HTMLDivElement>(null)

  useHotkeys(useMemo(() => [{ combo: 'mod+j', handler: () => setOpen((o) => !o) }], []))

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [items, confirm, open])

  const add = (item: Item) => setItems((list) => [...list, item])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || busy || !aiApiKey) return
    setDraft('')
    add({ type: 'user', text: message })
    setBusy(true)
    const before = history.current.length
    history.current.push({ role: 'user', content: message })
    abort.current = new AbortController()
    try {
      await runAssistant(
        aiApiKey,
        history.current,
        {
          onText: (delta) =>
            setItems((list) => {
              const last = list[list.length - 1]
              return last?.type === 'assistant' ? [...list.slice(0, -1), { ...last, text: last.text + delta }] : [...list, { type: 'assistant', text: delta }]
            }),
          onActivity: (label, kind) => add({ type: 'activity', kind, text: label }),
          confirm: (summary) => new Promise<boolean>((resolve) => setConfirm({ summary, answer: resolve })),
        },
        abort.current.signal,
      )
    } catch (error) {
      // Drop the half-finished turn so the next message starts from a clean history.
      history.current.length = before
      if (!abort.current.signal.aborted) add({ type: 'error', text: error instanceof Error ? error.message : 'Something went wrong.' })
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  const reset = () => {
    abort.current?.abort()
    confirm?.answer(false)
    history.current = []
    setItems([])
    setConfirm(null)
  }

  const answer = (ok: boolean) => {
    confirm?.answer(ok)
    setConfirm(null)
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Assistant (⌘J)"
        aria-label="Assistant"
        className="fixed right-6 bottom-6 z-40 flex size-12 items-center justify-center rounded-full bg-foreground text-background shadow-float transition-transform hover:scale-105"
      >
        {open ? <X className="size-5" strokeWidth={1.75} /> : <Sparkles className="size-5" strokeWidth={1.75} />}
      </button>

      {open && (
        <div className="fixed right-6 bottom-22 z-40 flex h-[min(640px,calc(100svh-7.5rem))] w-[400px] max-w-[calc(100vw-3rem)] animate-in flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-float fade-in-0 slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Assistant</span>
            <button onClick={reset} disabled={!items.length} title="New chat" className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30">
              <SquarePen className="size-4" strokeWidth={1.75} />
            </button>
          </div>

          {!aiApiKey ? (
            <div className="flex flex-1 flex-col justify-center gap-3 px-5">
              <p className="text-[14px] leading-relaxed">Paste an Anthropic API key to start. It stays on this Mac.</p>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (keyDraft.trim()) setSetting.mutate({ key: 'aiApiKey', value: keyDraft.trim() })
                }}
              >
                <Input autoFocus type="password" placeholder="Anthropic API key" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} />
                <Button type="submit" disabled={!keyDraft.trim()}>
                  Save
                </Button>
              </form>
            </div>
          ) : (
            <>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
                {!items.length && (
                  <div className="mt-auto flex flex-col items-start gap-1.5">
                    <p className="mb-1 text-[14px] text-muted-foreground">Ask about your week, or tell me what to add or change.</p>
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => void send(s)} className="rounded-full border border-border px-3 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {items.map((item, i) =>
                  item.type === 'activity' ? (
                    <div key={i} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      {item.kind === 'write' ? <Check className="size-3.5 shrink-0" strokeWidth={2} /> : <Eye className="size-3.5 shrink-0" strokeWidth={1.75} />}
                      <span className={cn(item.kind === 'write' && 'text-foreground')}>{item.text}</span>
                    </div>
                  ) : (
                    <div
                      key={i}
                      className={cn(
                        'max-w-[88%] text-[14px] leading-relaxed whitespace-pre-wrap',
                        item.type === 'user' && 'self-end rounded-2xl bg-primary-soft px-3.5 py-2',
                        item.type === 'error' && 'text-destructive',
                      )}
                    >
                      {item.text}
                    </div>
                  ),
                )}
                {confirm && (
                  <div className="flex flex-col gap-2.5 rounded-xl border border-border p-3">
                    <span className="text-[13.5px]">{confirm.summary}</span>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => answer(true)}>
                        Go ahead
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => answer(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                {busy && !confirm && items[items.length - 1]?.type !== 'assistant' && <span className="text-[12px] text-faint">Thinking…</span>}
                <div ref={bottom} />
              </div>

              <div className="flex items-end gap-2 border-t border-border px-3 py-3">
                <textarea
                  autoFocus
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void send(draft)
                    }
                  }}
                  placeholder="Message"
                  className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-1.5 py-2 text-[14px] leading-snug outline-none placeholder:text-faint [field-sizing:content]"
                />
                <button
                  onClick={() => void send(draft)}
                  disabled={!draft.trim() || busy}
                  aria-label="Send"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-25"
                >
                  <ArrowUp className="size-4" strokeWidth={2} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
