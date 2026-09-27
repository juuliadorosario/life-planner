import type { WidgetSize } from '@/types/domain'

/** The Home layout on first launch. Hidden widgets can be added back later. */
export const DEFAULT_WIDGETS: { type: string; size: WidgetSize; visible: boolean }[] = [
  // Home answers one question: what do I need today?
  { type: 'schedule', size: 'md', visible: true },
  { type: 'tasks', size: 'md', visible: true },
  { type: 'exams', size: 'sm', visible: true },
  { type: 'habits', size: 'sm', visible: true },
  { type: 'startup', size: 'sm', visible: true },
  // Everything else has its own page and can be added back from Customize.
  { type: 'calendar', size: 'sm', visible: false },
  { type: 'goals', size: 'md', visible: false },
  { type: 'study', size: 'sm', visible: false },
  { type: 'quickNotes', size: 'md', visible: false },
  { type: 'recentNotes', size: 'md', visible: false },
  { type: 'workout', size: 'sm', visible: false },
  { type: 'sleep', size: 'sm', visible: false },
  { type: 'finance', size: 'sm', visible: false },
  { type: 'countdown', size: 'sm', visible: false },
  { type: 'quickCapture', size: 'md', visible: false },
  { type: 'spotify', size: 'sm', visible: false },
]
