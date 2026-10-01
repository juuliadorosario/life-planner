import { Extension } from '@tiptap/core'
import type { Node as PmNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { WIKILINK } from '@/lib/wikilinks'

/**
 * Shows `[[Note title]]` in the note body as a link. The text stays plain
 * `[[…]]` in the document (so typing, pasting and search all just work); only
 * the rendering changes. Links to notes that don't exist yet look unresolved.
 * Clicking one calls `onOpen`.
 */
export interface WikiLinkOptions {
  exists: (title: string) => boolean
  onOpen: (title: string) => void
}

export const wikiLinkKey = new PluginKey<DecorationSet>('wikiLinks')

function decorate(doc: PmNode, exists: (title: string) => boolean): DecorationSet {
  const decorations: Decoration[] = []
  doc.descendants((block, blockPos) => {
    if (!block.isTextblock) return true
    // One character per inline leaf keeps string offsets equal to doc positions.
    const text = block.textBetween(0, block.content.size, undefined, '￼')
    for (const match of text.matchAll(WIKILINK)) {
      const title = match[1].trim()
      if (!title) continue
      const from = blockPos + 1 + match.index
      const resolved = exists(title)
      decorations.push(
        Decoration.inline(from, from + match[0].length, {
          class: resolved ? 'wikilink' : 'wikilink wikilink-unresolved',
          'data-wikilink': title,
          title: resolved ? `Open “${title}”` : `“${title}” doesn't exist yet — click to create it`,
        }),
      )
    }
    return false
  })
  return DecorationSet.create(doc, decorations)
}

export const WikiLink = Extension.create<WikiLinkOptions>({
  name: 'wikiLink',
  addOptions: () => ({ exists: () => false, onOpen: () => {} }),
  addProseMirrorPlugins() {
    const options = this.options
    return [
      new Plugin<DecorationSet>({
        key: wikiLinkKey,
        state: {
          init: (_, { doc }) => decorate(doc, (t) => options.exists(t)),
          apply: (tr, old) => (tr.docChanged || tr.getMeta(wikiLinkKey) ? decorate(tr.doc, (t) => options.exists(t)) : old),
        },
        props: {
          decorations: (state) => wikiLinkKey.getState(state),
          handleClick: (_view, _pos, event) => {
            const el = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-wikilink]')
            if (!el?.dataset.wikilink) return false
            event.preventDefault()
            options.onOpen(el.dataset.wikilink)
            return true
          },
        },
      }),
    ]
  },
})
