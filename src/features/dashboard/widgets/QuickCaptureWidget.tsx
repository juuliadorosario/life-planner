import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { useUI } from '@/app/ui-state'
import { Card } from '@/components/common/Card'
import { Kbd } from '@/components/common/Kbd'
import { useTaskActions } from '@/features/tasks/hooks'

export function QuickCaptureWidget() {
  const [value, setValue] = useState('')
  const [flash, setFlash] = useState(false)
  const { create } = useTaskActions()
  const { setCaptureOpen } = useUI()
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center justify-between">
        <span className="label-caps">Capture</span>
        <button onClick={() => setCaptureOpen(true)} className="flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-foreground">
          More options <Kbd>⌘⇧␣</Kbd>
        </button>
      </div>
      <form
        className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 focus-within:border-primary/40"
        onSubmit={(e) => {
          e.preventDefault()
          if (!value.trim()) return
          create.mutate({ title: value.trim() })
          setValue('')
          setFlash(true)
          window.setTimeout(() => setFlash(false), 1400)
        }}
      >
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="A thought, a task, an idea…" className="h-11 flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint" />
        {flash ? <Check className="size-4 text-primary animate-check" /> : <ArrowRight className="size-4 text-faint" />}
      </form>
      <p className="mt-2 text-[12px] text-muted-foreground">Goes to your Inbox as a task.</p>
    </Card>
  )
}
