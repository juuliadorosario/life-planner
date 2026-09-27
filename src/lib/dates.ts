import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'

/** Local calendar day as `YYYY-MM-DD`. */
export function toDay(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd')
}

export function today(): string {
  return toDay()
}

export function dayOffset(days: number, from: Date = new Date()): string {
  return toDay(addDays(from, days))
}

export function parseDay(day: string): Date {
  return parseISO(day)
}

/** Days from today to `day` (negative = in the past). */
export function daysUntil(day: string): number {
  return differenceInCalendarDays(parseISO(day), new Date())
}

/** "Today", "Tomorrow", "Yesterday", "Mon 29", "Oct 4". */
export function relativeDay(day: string): string {
  const diff = daysUntil(day)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff < 7) return format(parseISO(day), 'EEE d')
  return format(parseISO(day), 'MMM d')
}

export function greeting(date: Date = new Date()): string {
  const h = date.getHours()
  if (h < 5) return 'Good evening'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/** `HH:mm` → minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm')
}
