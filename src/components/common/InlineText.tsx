import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/** Text that looks like text and edits in place. Saves on blur or Enter. */
export function InlineText({ value, onSave, className, placeholder, multiline }: { value: string; onSave: (v: string) => void; className?: string; placeholder?: string; multiline?: boolean }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const commit = () => draft.trim() !== value && onSave(draft.trim())
  const shared = {
    value: draft,
    placeholder,
    onBlur: commit,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        ;(e.target as HTMLElement).blur()
      }
      if (e.key === 'Escape') {
        setDraft(value)
        ;(e.target as HTMLElement).blur()
      }
    },
    className: cn('w-full resize-none bg-transparent outline-none placeholder:text-faint focus:rounded-sm focus:bg-muted/50', className),
  }
  return multiline ? <textarea rows={3} {...shared} /> : <input {...shared} />
}
