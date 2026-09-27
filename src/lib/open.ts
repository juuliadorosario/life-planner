import { isTauri } from '@/providers/storage/StorageProvider'

/** Open a web link in the user's browser (the desktop app would otherwise ignore it). */
export async function openExternal(url: string) {
  if (isTauri()) {
    const { openUrl } = await import('@tauri-apps/plugin-opener')
    await openUrl(url)
  } else {
    window.open(url, '_blank', 'noopener')
  }
}

/** In the desktop app, send every http(s) link click to the browser. Call once. */
export function routeExternalLinks() {
  if (!isTauri()) return
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || !/^https?:\/\//.test(a.getAttribute('href') ?? '')) return
      e.preventDefault()
      void openExternal(a.href)
    },
    true,
  )
}
