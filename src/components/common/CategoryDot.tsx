import { cn } from '@/lib/utils'

export type Category = 'school' | 'study' | 'health' | 'startup' | 'personal' | 'exam' | 'finance'

export const CATEGORY_BG: Record<Category, string> = {
  school: 'bg-cat-school',
  study: 'bg-cat-study',
  health: 'bg-cat-health',
  startup: 'bg-cat-startup',
  personal: 'bg-cat-personal',
  exam: 'bg-cat-exam',
  finance: 'bg-cat-finance',
}

/** Map an area slug to its category colour. */
export function areaCategory(slug?: string | null): Category {
  if (slug === 'study' || slug === 'startup' || slug === 'health' || slug === 'finance') return slug
  return 'personal'
}

export function CategoryDot({ category, className }: { category: Category; className?: string }) {
  return <span className={cn('inline-block size-1.5 shrink-0 rounded-full', CATEGORY_BG[category], className)} />
}
