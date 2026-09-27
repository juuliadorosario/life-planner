import { Check } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { DashboardWidget } from '@/types/domain'
import { useWidgetActions } from './hooks'
import { WIDGETS } from './registry'

export function AddWidgetDialog({ open, onOpenChange, widgets }: { open: boolean; onOpenChange: (o: boolean) => void; widgets: DashboardWidget[] }) {
  const { add } = useWidgetActions()
  const shown = new Set(widgets.filter((w) => w.visible).map((w) => w.type))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 p-6 sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold">Add a widget</DialogTitle>
          <DialogDescription>Choose what lives on your Home.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {WIDGETS.map((w) => {
            const on = shown.has(w.type)
            return (
              <button
                key={w.type}
                disabled={on}
                onClick={() => add.mutate({ type: w.type, size: w.defaultSize }, { onSuccess: () => onOpenChange(false) })}
                className={cn(
                  'flex items-start gap-3 rounded-xl border border-border p-3 text-left transition-colors',
                  on ? 'opacity-50' : 'hover:border-border-strong hover:bg-muted/50',
                )}
              >
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <w.icon className="size-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium">{w.name}</div>
                  <div className="text-[12.5px] text-muted-foreground">{w.description}</div>
                </div>
                {on && <Check className="mt-1 size-3.5 text-primary" />}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
