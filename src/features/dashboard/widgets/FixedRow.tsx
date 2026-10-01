import { useNavigate } from 'react-router'
import { format } from 'date-fns'
import { useUI } from '@/app/ui-state'
import { daysUntil, parseDay } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { FixedItem } from '../plan'

/** One fixed date: day, title, and where it comes from. Tasks open their dialog; exams and assignments open Study. */
export function FixedRow({ item, showDay = true }: { item: FixedItem; showDay?: boolean }) {
  const { openTask } = useUI()
  const navigate = useNavigate()
  const days = daysUntil(item.date)
  const open = () => (item.taskId ? openTask(item.taskId) : item.href && navigate(item.href))
  return (
    <button
      onClick={open}
      className={cn('-mx-2 flex w-[calc(100%+1rem)] items-baseline gap-3 rounded-lg px-2 py-1 text-left hover:bg-muted/70', days < 0 && 'opacity-45')}
    >
      {showDay && (
        <span className={cn('w-12 shrink-0 text-[11px] tracking-wider uppercase tabular', days === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
          {format(parseDay(item.date), 'EEE d')}
        </span>
      )}
      <span className={cn('min-w-0 flex-1 text-[13.5px] leading-5', item.done && 'text-muted-foreground line-through decoration-faint', days === 0 && !item.done && 'font-medium')}>
        {item.title}
        {item.detail && <span className="ml-1.5 text-[12px] text-muted-foreground">· {item.detail}</span>}
      </span>
    </button>
  )
}
