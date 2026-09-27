import type { LucideIcon } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const NONE = '__none'

/** Compact pill-style select for attaching an object to a project, subject, goal… */
export function LinkSelect({
  icon: Icon,
  placeholder,
  value,
  options,
  onChange,
  className,
}: {
  icon: LucideIcon
  placeholder: string
  value: string | null | undefined
  options: { id: string; name: string }[]
  onChange: (value: string | null) => void
  className?: string
}) {
  return (
    <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
      <SelectTrigger
        size="sm"
        className={cn(
          'h-7 gap-1.5 rounded-full border-border bg-transparent px-2.5 text-[12.5px] shadow-none dark:bg-transparent [&>svg:last-child]:hidden',
          value ? 'text-foreground' : 'text-muted-foreground',
          className,
        )}
      >
        <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        <SelectItem value={NONE} className="text-muted-foreground">
          No {placeholder.toLowerCase()}
        </SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
