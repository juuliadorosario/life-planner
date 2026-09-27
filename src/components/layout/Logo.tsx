import { personal } from '@/config/personal'
import { cn } from '@/lib/utils'

/** The app mark: your own logo if `personal.logo` is set, otherwise a sun over the horizon. */
export function LogoMark({ className }: { className?: string }) {
  if (personal.logo) {
    return <img src={personal.logo} alt="" className={cn('rounded-[27%] dark:ring-1 dark:ring-white/15', className)} draggable={false} />
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="23" height="23" rx="7" className="fill-foreground" />
      <circle cx="12" cy="13.5" r="4.25" className="fill-background" />
      <rect x="5" y="15.5" width="14" height="4" className="fill-foreground" />
      <rect x="5.5" y="15.25" width="13" height="1.1" rx="0.55" className="fill-background" />
    </svg>
  )
}
