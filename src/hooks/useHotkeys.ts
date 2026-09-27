import { useEffect } from 'react'

export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

type Binding = {
  /** e.g. `mod+k`, `mod+shift+space`, `n`, `/`. `mod` = ⌘ on macOS, Ctrl elsewhere. */
  combo: string
  handler: (e: KeyboardEvent) => void
  /** Fire even while typing in an input. Defaults to true for `mod` combos. */
  allowInInputs?: boolean
}

function matches(e: KeyboardEvent, combo: string) {
  const parts = combo.toLowerCase().split('+')
  const key = parts.pop()!
  const mod = parts.includes('mod')
  const shift = parts.includes('shift')
  const alt = parts.includes('alt')
  const pressed = e.key === ' ' ? 'space' : e.key.toLowerCase()
  return (
    pressed === key &&
    (e.metaKey || e.ctrlKey) === mod &&
    e.shiftKey === shift &&
    e.altKey === alt
  )
}

export function useHotkeys(bindings: Binding[]) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      for (const b of bindings) {
        if (!matches(e, b.combo)) continue
        const allow = b.allowInInputs ?? b.combo.includes('mod')
        if (!allow && isTypingTarget(e.target)) continue
        e.preventDefault()
        b.handler(e)
        return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [bindings])
}
