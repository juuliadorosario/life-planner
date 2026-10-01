// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { extractWikiLinks, findByTitle, linksTo } from '@/lib/wikilinks'
import { WikiLink } from './wikiLinkExtension'

// jsdom has no ClipboardEvent; ProseMirror's pasteText only needs one to exist.
globalThis.ClipboardEvent ??= class extends Event {
  clipboardData = null
} as unknown as typeof ClipboardEvent

// The real note that broke: its title was saved with a trailing space.
const notes = [
  { id: 'a', title: 'Mitjans de producció ' },
  { id: 'b', title: 'Sistemes econòmics' },
]
const exists = (t: string) => !!findByTitle(notes, t)

let editor: Editor | undefined
afterEach(() => editor?.destroy())

function makeEditor(onOpen = vi.fn()) {
  editor = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, WikiLink.configure({ exists, onOpen })],
  })
  return { editor, onOpen }
}

function typeText(e: Editor, text: string) {
  for (const ch of text) e.view.dispatch(e.state.tr.insertText(ch))
}

const links = (e: Editor) => [...e.view.dom.querySelectorAll<HTMLElement>('[data-wikilink]')]

function click(e: Editor, el: HTMLElement) {
  const event = { target: el, preventDefault: vi.fn() } as unknown as MouseEvent
  return e.view.someProp('handleClick', (f) => f(e.view, 0, event))
}

describe('parsing [[links]]', () => {
  it('matches titles case-insensitively and ignores stray spaces', () => {
    expect(findByTitle(notes, 'MITJANS DE PRODUCCIÓ')?.id).toBe('a')
    expect(findByTitle(notes, '  mitjans  de producció')?.id).toBe('a')
    expect(findByTitle(notes, 'Mitjans')).toBeUndefined()
  })

  it('matches accented titles whatever their Unicode form', () => {
    expect(findByTitle(notes, 'Mitjans de producció')?.id).toBe('a')
  })

  it('finds backlinks in note text regardless of case', () => {
    const text = 'El socialisme és un sistema on els [[mitjans de producció]] són col·lectius'
    expect(linksTo(text, 'Mitjans de producció ')).toBe(true)
    expect(linksTo(text, 'Sistemes econòmics')).toBe(false)
  })

  it('lists each link once, keeping the first spelling', () => {
    expect(extractWikiLinks('[[Monopolis]] and [[monopolis]] and [[ Estat ]] and [[]]')).toEqual(['Monopolis', 'Estat'])
  })
})

describe('inline links in the editor', () => {
  it('renders a typed [[link]] and opens the note on click', () => {
    const { editor, onOpen } = makeEditor()
    typeText(editor, 'Els [[Mitjans de producció]] són de tothom')

    const [link] = links(editor)
    expect(link.textContent).toBe('[[Mitjans de producció]]')
    expect(link.className).toBe('wikilink')
    expect(click(editor, link)).toBe(true)
    expect(onOpen).toHaveBeenCalledWith('Mitjans de producció')
    // What gets saved is what backlinks search.
    expect(linksTo(editor.getText(), notes[0].title)).toBe(true)
  })

  it('renders a pasted [[link]] with different case', () => {
    const { editor } = makeEditor()
    editor.view.pasteText('Veure [[SISTEMES ECONÒMICS]] i [[mitjans de producció]].')

    expect(links(editor).map((l) => [l.dataset.wikilink, l.className])).toEqual([
      ['SISTEMES ECONÒMICS', 'wikilink'],
      ['mitjans de producció', 'wikilink'],
    ])
  })

  it('marks links to missing notes as unresolved and still reports the click', () => {
    const { editor, onOpen } = makeEditor()
    editor.view.pasteText('Una idea: [[Plusvàlua]]')

    const [link] = links(editor)
    expect(link.className).toBe('wikilink wikilink-unresolved')
    expect(link.title).toMatch(/click to create/)
    click(editor, link)
    expect(onOpen).toHaveBeenCalledWith('Plusvàlua')
  })

  it('is not a link until the closing brackets are typed', () => {
    const { editor } = makeEditor()
    typeText(editor, 'Els [[Mitjans de producció')
    expect(links(editor)).toHaveLength(0)
    typeText(editor, ']]')
    expect(links(editor)).toHaveLength(1)
  })
})
