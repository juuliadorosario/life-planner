export interface Track {
  id: string
  title: string
  artist: string
  album: string
  durationMs: number
  /** Artwork URL. The mock provider returns null and the UI draws a cover. */
  artworkUrl: string | null
  /** Two colours for the generated cover when there is no artwork. */
  palette: [string, string]
}

export interface PlaybackState {
  track: Track | null
  isPlaying: boolean
  progressMs: number
  device?: string
  /** Why there is no track, when there isn't one. */
  status?: 'not-running' | 'stopped' | 'playing' | 'paused' | 'unavailable'
}

/**
 * Music playback. The first version is a mock; a `SpotifyWebApiProvider`
 * (OAuth PKCE + Web API) will implement the same interface. UI components only
 * ever talk to this interface.
 */
export interface SpotifyProvider {
  readonly id: string
  readonly connected: boolean
  getPlayback(): Promise<PlaybackState>
  play(): Promise<void>
  pause(): Promise<void>
  next(): Promise<void>
  previous(): Promise<void>
  /** Called whenever playback changes. Returns an unsubscribe function. */
  subscribe(listener: (state: PlaybackState) => void): () => void
}
