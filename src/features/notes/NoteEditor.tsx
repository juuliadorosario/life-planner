import { useEffect, useRef } from 'react'
import type { EditorView } from '@tiptap/pm/view'
import { EditorContent, useEditor } from '@tiptap/react'
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Bold, Code, Heading2, ImagePlus, Italic, List, ListChecks, Strikethrough } from 'lucide-react'
import { fileToNoteImage } from '@/lib/images'
import { cn } from '@/lib/utils'
import { WikiLink, wikiLinkKey } from './wikiLinkExtension'

/**
 * Rich-text editor with markdown shortcuts (`#`, `-`, `[]`, `>`, `**`…).
 * Emits HTML and plain text on every change; the page debounces saving.
 * `[[Title]]` renders as a link: `noteExists` decides whether it resolves,
 * `onOpenLink` runs on click. Change `linkTargetsKey` when titles change.
 * Images (photos, charts, screenshots, GIFs) go in by pasting, dropping, or
 * the image button on an empty line, and are stored inside the note's HTML.
 */
const imageFiles = (files?: FileList | null) => [...(files ?? [])].filter((f) => f.type.startsWith('image/'))

/** Insert images at `pos` (or the cursor), one after another. */
async function insertImages(view: EditorView, files: File[], pos?: number) {
  const sources = await Promise.all(files.map(fileToNoteImage))
  if (view.isDestroyed) return
  const { schema, tr, selection } = view.state
  const at = Math.min(pos ?? selection.from, tr.doc.content.size)
  view.dispatch(tr.insert(at, sources.map((src) => schema.nodes.image.create({ src }))).scrollIntoView())
  view.focus()
}

export function NoteEditor({
  content,
  onChange,
  noteExists = () => false,
  onOpenLink = () => {},
  linkTargetsKey,
}: {
  content: string
  onChange: (html: string, text: string) => void
  noteExists?: (title: string) => boolean
  onOpenLink?: (title: string) => void
  linkTargetsKey?: string
}) {
  const onChangeRef = useRef(onChange)
  const existsRef = useRef(noteExists)
  const openRef = useRef(onOpenLink)
  useEffect(() => {
    onChangeRef.current = onChange
    existsRef.current = noteExists
    openRef.current = onOpenLink
  })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ allowBase64: true, resize: { enabled: true, directions: ['left', 'right', 'bottom-right'], minWidth: 80, alwaysPreserveAspectRatio: true } }),
      // oxlint-disable-next-line react/refs -- refs are read in the callbacks, not during render
      WikiLink.configure({ exists: (t) => existsRef.current(t), onOpen: (t) => openRef.current(t) }),
      Placeholder.configure({ placeholder: 'Start writing… # for headings, - for lists, [] for a checklist, [[Title]] to link a note. Paste or drop images.' }),
    ],
    content,
    editorProps: {
      attributes: { class: 'prose-note min-h-[50vh]' },
      handlePaste: (view, event) => {
        const files = imageFiles(event.clipboardData?.files)
        if (!files.length) return false
        void insertImages(view, files)
        return true
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = imageFiles(event.dataTransfer?.files)
        if (moved || !files.length) return false
        event.preventDefault()
        void insertImages(view, files, view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos)
        return true
      },
    },
    onUpdate: ({ editor }) => onChangeRef.current(editor.getHTML(), editor.getText({ blockSeparator: '\n' })),
  })

  const fileInput = useRef<HTMLInputElement>(null)
  useEffect(() => () => editor?.destroy(), [editor])
  // Re-check which links resolve when notes are added or renamed.
  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.view.dispatch(editor.state.tr.setMeta(wikiLinkKey, true))
  }, [editor, linkTargetsKey])
  if (!editor) return null

  const btn = (active: boolean, run: () => void, Icon: typeof Bold, label: string) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault()
        run()
      }}
      aria-label={label}
      className={cn('grid size-7 place-items-center rounded-md transition-colors', active ? 'bg-background/15 text-background' : 'text-background/70 hover:text-background')}
    >
      <Icon className="size-3.5" />
    </button>
  )

  return (
    <>
      <BubbleMenu editor={editor} shouldShow={({ editor, from, to }) => from !== to && !editor.isActive('image')} className="flex items-center gap-0.5 rounded-lg bg-foreground p-1 shadow-float">
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), Bold, 'Bold')}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), Italic, 'Italic')}
        {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), Strikethrough, 'Strikethrough')}
        {btn(editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), Code, 'Code')}
        <span className="mx-0.5 h-4 w-px bg-background/20" />
        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), Heading2, 'Heading')}
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), List, 'List')}
        {btn(editor.isActive('taskList'), () => editor.chain().focus().toggleTaskList().run(), ListChecks, 'Checklist')}
      </BubbleMenu>
      <FloatingMenu editor={editor} className="-ml-10">
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            fileInput.current?.click()
          }}
          aria-label="Add image"
          title="Add image"
          className="grid size-7 place-items-center rounded-md text-faint transition-colors hover:bg-muted hover:text-foreground"
        >
          <ImagePlus className="size-4" strokeWidth={1.5} />
        </button>
      </FloatingMenu>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void insertImages(editor.view, imageFiles(e.target.files))
          e.target.value = ''
        }}
      />
      <EditorContent editor={editor} />
    </>
  )
}
