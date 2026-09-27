import { useSearchParams } from 'react-router'
import { cn } from '@/lib/utils'

/** Underline tabs synced to `?tab=`. */
export function useTab<T extends string>(tabs: readonly T[]): [T, (t: T) => void] {
  const [params, setParams] = useSearchParams()
  const current = (tabs.includes(params.get('tab') as T) ? params.get('tab') : tabs[0]) as T
  return [current, (t) => setParams({ tab: t }, { replace: true })]
}

export function TabBar<T extends string>({ tabs, value, onChange, labels }: { tabs: readonly T[]; value: T; onChange: (t: T) => void; labels?: Partial<Record<T, string>> }) {
  return (
    <div className="mb-7 flex gap-6 border-b border-border">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            '-mb-px border-b-[1.5px] pb-2.5 text-[13.5px] capitalize transition-colors',
            value === t ? 'border-foreground font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {labels?.[t] ?? t}
        </button>
      ))}
    </div>
  )
}
