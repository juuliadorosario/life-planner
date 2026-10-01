import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { NewTask } from '@/types/domain'

export type TaskDefaults = Partial<Omit<NewTask, 'id'>>

interface UIState {
  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void
  captureOpen: boolean
  setCaptureOpen: (open: boolean) => void
  /** `undefined` = closed; an object (possibly empty) = open with defaults. */
  newTask: TaskDefaults | undefined
  openNewTask: (defaults?: TaskDefaults) => void
  closeNewTask: () => void
  openTaskId: string | undefined
  openTask: (id: string | undefined) => void
  dialog: 'project' | 'goal' | 'session' | 'exam' | 'event' | undefined
  /** What the open dialog starts from: a preselected subject, or the exam being edited. */
  dialogContext: DialogContext
  openDialog: (d: UIState['dialog'], context?: DialogContext) => void
}

export interface DialogContext {
  subjectId?: string
  examId?: string
}

const UIContext = createContext<UIState | null>(null)

/** App-wide overlays: command palette, quick capture, create dialogs. */
export function UIProvider({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [newTask, setNewTask] = useState<TaskDefaults | undefined>()
  const [openTaskId, openTask] = useState<string | undefined>()
  const [dialog, setDialog] = useState<UIState['dialog']>()
  const [dialogContext, setDialogContext] = useState<DialogContext>({})
  const openDialog = useCallback((d: UIState['dialog'], context: DialogContext = {}) => {
    setDialog(d)
    setDialogContext(context)
  }, [])

  const openNewTask = useCallback((defaults: TaskDefaults = {}) => setNewTask(defaults), [])
  const closeNewTask = useCallback(() => setNewTask(undefined), [])

  const value = useMemo(
    () => ({ paletteOpen, setPaletteOpen, captureOpen, setCaptureOpen, newTask, openNewTask, closeNewTask, openTaskId, openTask, dialog, dialogContext, openDialog }),
    [paletteOpen, captureOpen, newTask, openNewTask, closeNewTask, openTaskId, dialog, dialogContext, openDialog],
  )
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI(): UIState {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>')
  return ctx
}
