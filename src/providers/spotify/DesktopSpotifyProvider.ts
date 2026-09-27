import { invoke } from '@tauri-apps/api/core'
import type { PlaybackState, SpotifyProvider } from './SpotifyProvider'

interface NativeState {
  status: string
  trackId: string | null
  title: string | null
  artist: string | null
  album: string | null
  durationMs: number | null
  progressMs: number | null
  artworkUrl: string | null
}

const POLL_MS = 2000

/**
 * The Spotify app on this Mac, through a native command (AppleScript under the
 * hood). Polls every two seconds and advances the progress bar locally in
 * between, so it moves smoothly without hammering Spotify.
 */
export class DesktopSpotifyProvider implements SpotifyProvider {
  readonly id = 'spotify-desktop'
  connected = false
  private state: PlaybackState = { track: null, isPlaying: false, progressMs: 0, status: 'not-running' }
  private listeners = new Set<(s: PlaybackState) => void>()
  private poller: number | undefined
  private ticker: number | undefined

  constructor() {
    void this.refresh()
    this.poller = window.setInterval(() => void this.refresh(), POLL_MS)
    this.ticker = window.setInterval(() => this.tick(), 1000)
  }

  private emit() {
    this.listeners.forEach((l) => l(this.state))
  }

  private tick() {
    if (!this.state.isPlaying || !this.state.track) return
    this.state = { ...this.state, progressMs: Math.min(this.state.progressMs + 1000, this.state.track.durationMs) }
    this.emit()
  }

  async refresh() {
    try {
      const s = await invoke<NativeState>('spotify_state')
      this.connected = s.status === 'playing' || s.status === 'paused'
      this.state =
        this.connected && s.title
          ? {
              status: s.status as PlaybackState['status'],
              isPlaying: s.status === 'playing',
              progressMs: s.progressMs ?? 0,
              device: 'This Mac',
              track: {
                id: s.trackId ?? s.title,
                title: s.title,
                artist: s.artist ?? '',
                album: s.album ?? '',
                durationMs: s.durationMs ?? 0,
                artworkUrl: s.artworkUrl,
                palette: ['#d6d6d6', '#5a5a5a'],
              },
            }
          : { track: null, isPlaying: false, progressMs: 0, status: s.status as PlaybackState['status'] }
    } catch {
      // Usually: permission to control Spotify not granted yet.
      this.connected = false
      this.state = { track: null, isPlaying: false, progressMs: 0, status: 'unavailable' }
    }
    this.emit()
  }

  private async command(action: 'play' | 'pause' | 'next' | 'previous') {
    await invoke('spotify_command', { action })
    // Spotify needs a moment to switch tracks before it reports the new one.
    window.setTimeout(() => void this.refresh(), 250)
  }

  async getPlayback() {
    return this.state
  }
  async play() {
    this.state = { ...this.state, isPlaying: true }
    this.emit()
    await this.command('play')
  }
  async pause() {
    this.state = { ...this.state, isPlaying: false }
    this.emit()
    await this.command('pause')
  }
  next() {
    return this.command('next')
  }
  previous() {
    return this.command('previous')
  }
  subscribe(listener: (s: PlaybackState) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispose() {
    window.clearInterval(this.poller)
    window.clearInterval(this.ticker)
  }
}
