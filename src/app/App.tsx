import { useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { LogoMark } from '@/components/layout/Logo'
import { initDatabase } from '@/db/client'
import { queryClient } from '@/hooks/data'
import { ThemeProvider } from './theme'
import { ToastProvider } from './toast'
import { UIProvider } from './ui-state'
import { router } from './router'
import { personal } from '@/config/personal'

export function App() {
  const [state, setState] = useState<'loading' | 'ready' | Error>('loading')

  useEffect(() => {
    initDatabase().then(
      () => setState('ready'),
      (e: unknown) => setState(e instanceof Error ? e : new Error(String(e))),
    )
  }, [])

  return (
    <ThemeProvider>
      {state === 'ready' ? (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={400}>
            <ToastProvider>
              <UIProvider>
                <RouterProvider router={router} />
              </UIProvider>
            </ToastProvider>
          </TooltipProvider>
        </QueryClientProvider>
      ) : (
        <div className="grid h-svh place-items-center bg-background">
          {state === 'loading' ? (
            <LogoMark className="size-8 animate-pulse opacity-60" />
          ) : (
            <div className="max-w-sm text-center">
              <p className="font-medium">{personal.appName} couldn't open its database.</p>
              <p className="mt-2 text-[13px] text-muted-foreground">{state.message}</p>
            </div>
          )}
        </div>
      )}
    </ThemeProvider>
  )
}
