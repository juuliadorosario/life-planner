import { useEffect, useState } from 'react'
import { getSpotifyProvider, type PlaybackState } from '@/providers/spotify'

/** Live playback state from whichever SpotifyProvider is active. */
export function usePlayback() {
  const provider = getSpotifyProvider()
  const [state, setState] = useState<PlaybackState | null>(null)
  useEffect(() => {
    let alive = true
    void provider.getPlayback().then((s) => alive && setState(s))
    const off = provider.subscribe(setState)
    return () => {
      alive = false
      off()
    }
  }, [provider])
  return { state, provider }
}
