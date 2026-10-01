/**
 * `[[Note title]]` links between notes. Titles match case-insensitively and
 * ignore stray spaces, so `[[mitjans de producció]]` finds "Mitjans de producció ".
 */
export const WIKILINK = /\[\[([^[\]\n]+?)\]\]/g

/** The form two titles are compared in. */
export function normalizeTitle(title: string): string {
  return title.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

/** Titles linked from `text`, in order, once each (as first written). */
export function extractWikiLinks(text: string): string[] {
  const seen = new Map<string, string>()
  for (const [, raw] of text.matchAll(WIKILINK)) {
    const title = raw.trim()
    const key = normalizeTitle(title)
    if (key && !seen.has(key)) seen.set(key, title)
  }
  return [...seen.values()]
}

/** Does `text` link to a note called `title`? */
export function linksTo(text: string, title: string): boolean {
  const key = normalizeTitle(title)
  return !!key && extractWikiLinks(text).some((t) => normalizeTitle(t) === key)
}

export function findByTitle<T extends { title: string }>(notes: T[], title: string): T | undefined {
  const key = normalizeTitle(title)
  return key ? notes.find((n) => normalizeTitle(n.title) === key) : undefined
}
