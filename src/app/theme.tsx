import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const ThemeContext = createContext<{
  mode: ThemeMode
  resolved: 'light' | 'dark'
  setMode: (m: ThemeMode) => void
  /** Show every photo in black & white. */
  photosMono: boolean
  setPhotosMono: (v: boolean) => void
  accent: Accent
  setAccent: (a: Accent) => void
}>({
  mode: 'system',
  resolved: 'light',
  setMode: () => {},
  photosMono: false,
  setPhotosMono: () => {},
  accent: 'black',
  setAccent: () => {},
})

export type Accent = 'black' | 'camel'

function readAccent(): Accent {
  try {
    return localStorage.getItem('lifeos.accent') === 'camel' ? 'camel' : 'black'
  } catch {
    return 'black'
  }
}

function readMono(): boolean {
  try {
    return localStorage.getItem('lifeos.photosMono') === '1'
  } catch {
    return false
  }
}

function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem('lifeos.theme')
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* storage unavailable */
  }
  return 'system'
}

/** Theme lives in localStorage (not SQLite) so the first paint is already right. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readMode)
  const [photosMono, setPhotosMonoState] = useState(readMono)
  const [accent, setAccentState] = useState<Accent>(readAccent)

  useEffect(() => {
    document.documentElement.classList.toggle('accent-camel', accent === 'camel')
  }, [accent])

  const setAccent = (a: Accent) => {
    setAccentState(a)
    try {
      localStorage.setItem('lifeos.accent', a)
    } catch {
      /* storage unavailable */
    }
  }
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.documentElement.style.colorScheme = resolved
  }, [resolved])

  useEffect(() => {
    document.documentElement.classList.toggle('photos-mono', photosMono)
  }, [photosMono])

  const setPhotosMono = (v: boolean) => {
    setPhotosMonoState(v)
    try {
      localStorage.setItem('lifeos.photosMono', v ? '1' : '0')
    } catch {
      /* storage unavailable */
    }
  }

  const setMode = (m: ThemeMode) => {
    setModeState(m)
    try {
      localStorage.setItem('lifeos.theme', m)
    } catch {
      /* storage unavailable */
    }
  }

  return <ThemeContext.Provider value={{ mode, resolved, setMode, photosMono, setPhotosMono, accent, setAccent }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
