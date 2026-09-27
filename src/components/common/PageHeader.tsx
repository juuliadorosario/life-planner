import type { ReactNode } from 'react'
import { PhotoStrip } from '@/features/photos/PhotoStrip'
import { cn } from '@/lib/utils'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('mb-8 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 label-caps">{eyebrow}</div>}
        <h1 className="display text-[38px] leading-[1.05]">{title}</h1>
        {description && <p className="mt-1.5 text-[14px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}

/** Centered page column with consistent gutters. */
export function Page({ children, className, wide, banner, bannerCount = 5 }: { children: ReactNode; className?: string; wide?: boolean; banner?: string; bannerCount?: number }) {
  return (
    <div className={cn('animate-page mx-auto w-full px-6 pb-24 md:px-10', banner ? 'pt-6' : 'pt-10', wide ? 'max-w-[1320px]' : 'max-w-[1120px]', className)}>
      {banner && <PhotoStrip name={banner} count={bannerCount} className="mb-9 h-[132px]" />}
      {children}
    </div>
  )
}
