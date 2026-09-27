import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'gap-1.5 py-6' : 'gap-2 py-14', className)}>
      {Icon && (
        <div className={cn('mb-1 grid place-items-center rounded-full bg-muted text-muted-foreground', compact ? 'size-8' : 'size-10')}>
          <Icon className={compact ? 'size-4' : 'size-[18px]'} strokeWidth={1.75} />
        </div>
      )}
      <p className={cn('font-medium text-foreground', compact ? 'text-[13px]' : 'text-sm')}>{title}</p>
      {description && <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
