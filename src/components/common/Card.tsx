import type { ComponentProps, ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/** The basic surface of LifeOS: white, soft border, generous padding. */
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-card', className)}
      {...props}
    />
  )
}

export function CardHeader({
  title,
  href,
  action,
  className,
}: {
  title: ReactNode
  href?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-h-7 items-center justify-between gap-3', className)}>
      {href ? (
        <Link to={href} className="group/title flex items-center gap-1 label-caps transition-colors hover:text-foreground">
          {title}
          <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover/title:opacity-100" />
        </Link>
      ) : (
        <span className="label-caps">{title}</span>
      )}
      {action}
    </div>
  )
}

/** A card with a small uppercase title row, used by widgets and side panels. */
export function Panel({
  title,
  href,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: ReactNode
  href?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <Card className={cn('flex flex-col p-5', className)}>
      <CardHeader title={title} href={href} action={action} />
      <div className={cn('mt-3 flex-1', bodyClassName)}>{children}</div>
    </Card>
  )
}
