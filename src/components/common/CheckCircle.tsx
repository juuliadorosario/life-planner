import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Round checkbox used for tasks, habits and milestones. */
export function CheckCircle({
  checked,
  onChange,
  className,
  size = 'md',
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
  size?: 'sm' | 'md'
  label?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label ?? (checked ? 'Mark as not done' : 'Mark as done')}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={cn(
        'group/check grid shrink-0 place-items-center rounded-full border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        size === 'md' ? 'size-[18px]' : 'size-4',
        checked
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border-strong bg-card hover:border-primary/60',
        className,
      )}
    >
      {checked ? (
        <Check className="animate-check size-[11px]" strokeWidth={3} />
      ) : (
        <Check className="size-[11px] text-primary opacity-0 transition-opacity group-hover/check:opacity-40" strokeWidth={3} />
      )}
    </button>
  )
}
