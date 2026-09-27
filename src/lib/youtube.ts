/** Video id from any YouTube URL: watch?v=, youtu.be/, shorts/, embed/. */
export function youTubeId(url: string): string | null {
  try {
    const u = new URL(url.trim())
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0] || null
    if (u.searchParams.get('v')) return u.searchParams.get('v')
    const m = u.pathname.match(/\/(shorts|embed|live)\/([\w-]{6,})/)
    return m ? m[2] : null
  } catch {
    return null
  }
}

export const youTubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`

/** Title and channel through YouTube's public oEmbed endpoint (no API key). */
export async function youTubeInfo(url: string): Promise<{ title: string; channel: string } | null> {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`)
    if (!r.ok) return null
    const j = (await r.json()) as { title?: string; author_name?: string }
    return j.title ? { title: j.title, channel: j.author_name ?? '' } : null
  } catch {
    return null
  }
}

/** "30 MIN FULL BODY PILATES" → 30. */
export function guessMinutes(title: string): number | null {
  const m = title.match(/(\d{1,3})\s*(?:-|\s)?\s*(?:min|mins|minute|minutes|minutos|minuts)\b/i)
  return m ? Number(m[1]) : null
}

export const FOCUS = [
  { id: 'full body', label: 'Full body', re: /full[\s-]?body|total body|cuerpo completo|cos sencer/i },
  { id: 'core', label: 'Core', re: /\b(abs?|core|abdomen|abdominal)/i },
  { id: 'legs', label: 'Legs & glutes', re: /leg|glute|booty|pierna|gluteo|lower body/i },
  { id: 'arms', label: 'Arms', re: /\barms?\b|upper body|brazos/i },
  { id: 'back', label: 'Back & posture', re: /back|posture|espalda/i },
  { id: 'stretch', label: 'Stretch', re: /stretch|mobility|flexib|estiram/i },
] as const

export function guessFocus(title: string): string | null {
  return FOCUS.find((f) => f.re.test(title))?.id ?? null
}
