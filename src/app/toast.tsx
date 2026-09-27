import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'

const ToastContext = createContext<(message: string) => void>(() => {})

/** One quiet confirmation at a time, bottom centre. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)
  const show = useCallback((message: string) => {
    const id = Date.now()
    setToast({ id, message })
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2200)
  }, [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div key={toast.id} className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center">
          <div className="flex animate-in items-center gap-2 rounded-full bg-foreground py-2 pr-4 pl-3 text-[13px] text-background shadow-float fade-in-0 slide-in-from-bottom-2 duration-200">
            <Check className="size-3.5" strokeWidth={2.5} />
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
