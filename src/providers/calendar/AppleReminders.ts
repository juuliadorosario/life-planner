import { invoke } from '@tauri-apps/api/core'
import { isTauri } from '@/providers/storage/StorageProvider'
import type { AppleCalendarStatus } from './AppleCalendarProvider'

export interface Reminder {
  id: string
  title: string
  /** Missing when the reminder has no date. */
  due: Date | null
  /** Due on a day, without a time. */
  allDay: boolean
  listTitle: string | null
  listColor: string | null
}

interface NativeReminder extends Omit<Reminder, 'due'> {
  due: number | null
}

/**
 * Apple Reminders on this Mac through EventKit (native Tauri commands).
 * Separate from Calendar: macOS asks for Reminders permission on its own.
 */
export const AppleReminders = {
  /** Present only in the desktop app. */
  available: isTauri(),

  status: () => invoke<AppleCalendarStatus>('reminders_status'),

  requestAccess: () => invoke<boolean>('reminders_request_access'),

  /** Unfinished reminders due in the range; `start: null` also brings everything overdue. */
  async list(start: Date | null, end: Date): Promise<Reminder[]> {
    const found = await invoke<NativeReminder[]>('reminders_list', { start: start?.getTime() ?? null, end: end.getTime() })
    return found.map((r) => ({ ...r, due: r.due == null ? null : new Date(r.due) }))
  },

  setCompleted: (id: string, completed: boolean) => invoke<void>('reminders_set_completed', { id, completed }),
}
