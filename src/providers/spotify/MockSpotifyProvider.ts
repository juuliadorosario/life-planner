import type { PlaybackState, SpotifyProvider, Track } from './SpotifyProvider'

const QUEUE: Track[] = [
  { id: '1', title: 'Holocene', artist: 'Bon Iver', album: 'Bon Iver, Bon Iver', durationMs: 337000, artworkUrl: null, palette: ['#d6d6d6', '#5a5a5a'] },
  { id: '2', title: 'Nuvole Bianche', artist: 'Ludovico Einaudi', album: 'Una Mattina', durationMs: 357000, artworkUrl: null, palette: ['#ededed', '#8f8f8f'] },
  { id: '3', title: 'Sunset Lover', artist: 'Petit Biscuit', album: 'Presence', durationMs: 238000, artworkUrl: null, palette: ['#bdbdbd', '#2e2e2e'] },
  { id: '4', title: 'Intro', artist: 'The xx', album: 'xx', durationMs: 128000, artworkUrl: null, palette: ['#3a3a3a', '#9a9a9a'] },
  { id: '5', title: 'Gymnopédie No. 1', artist: 'Erik Satie', album: 'Piano Works', durationMs: 205000, artworkUrl: null, palette: ['#c9c9c9', '#1a1a1a'] },
]

/** Simulated playback with a moving progress bar. No network. */
export class MockSpotifyProvider implements SpotifyProvider {
  readonly id = 'mock'
  readonly connected = false
  private index = 0
  private progressMs = 94000
  private isPlaying = true
  private timer: number | undefined
  private listeners = new Set<(s: PlaybackState) => void>()

  constructor() {
    this.timer = window.setInterval(() => this.tick(), 1000)
  }

  private get state(): PlaybackState {
    return { track: QUEUE[this.index], isPlaying: this.isPlaying, progressMs: this.progressMs, device: 'MacBook' }
  }

  private emit() {
    const s = this.state
    this.listeners.forEach((l) => l(s))
  }

  private tick() {
    if (!this.isPlaying) return
    this.progressMs += 1000
    if (this.progressMs >= QUEUE[this.index].durationMs) {
      this.index = (this.index + 1) % QUEUE.length
      this.progressMs = 0
    }
    this.emit()
  }

  async getPlayback() {
    return this.state
  }
  async play() {
    this.isPlaying = true
    this.emit()
  }
  async pause() {
    this.isPlaying = false
    this.emit()
  }
  async next() {
    this.index = (this.index + 1) % QUEUE.length
    this.progressMs = 0
    this.emit()
  }
  async previous() {
    if (this.progressMs > 3000) this.progressMs = 0
    else this.index = (this.index - 1 + QUEUE.length) % QUEUE.length
    this.progressMs = 0
    this.emit()
  }
  subscribe(listener: (s: PlaybackState) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispose() {
    window.clearInterval(this.timer)
  }
}
