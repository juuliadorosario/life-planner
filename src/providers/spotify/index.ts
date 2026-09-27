import { isTauri } from '@/providers/storage/StorageProvider'
import { DesktopSpotifyProvider } from './DesktopSpotifyProvider'
import { MockSpotifyProvider } from './MockSpotifyProvider'
import type { SpotifyProvider } from './SpotifyProvider'

export * from './SpotifyProvider'

let provider: SpotifyProvider | undefined

/**
 * The active music provider: the Spotify app on this Mac inside the desktop
 * app, a demo player in the browser. A Spotify Web API provider can slot in
 * here later without touching the UI.
 */
export function getSpotifyProvider(): SpotifyProvider {
  provider ??= isTauri() ? new DesktopSpotifyProvider() : new MockSpotifyProvider()
  return provider
}
