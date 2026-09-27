import { useEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Bold, Code, Heading2, Italic, List, ListChecks, Strikethrough } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Rich-text editor with markdown shortcuts (`#`, `-`, `[]`, `>`, `**`…).
 * Emits HTML and plain text on every change; the page debounces saving.
 */
export function NoteEditor({ content, onChange }: { content: string; onChange: (html: string, text: string) => void }) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Start writing… Use # for headings, - for lists, [] for a checklist, [[Title]] to link a note.' }),
    ],
    content,
    editorProps: { attributes: { class: 'prose-note min-h-[50vh]' } },
    onUpdate: ({ editor }) => onChangeRef.current(editor.getHTML(), editor.getText({ blockSeparator: '\n' })),
  })

  useEffect(() => () => editor?.destroy(), [editor])
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
      <BubbleMenu editor={editor} className="flex items-center gap-0.5 rounded-lg bg-foreground p-1 shadow-float">
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), Bold, 'Bold')}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), Italic, 'Italic')}
        {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), Strikethrough, 'Strikethrough')}
        {btn(editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), Code, 'Code')}
        <span className="mx-0.5 h-4 w-px bg-background/20" />
        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), Heading2, 'Heading')}
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), List, 'List')}
        {btn(editor.isActive('taskList'), () => editor.chain().focus().toggleTaskList().run(), ListChecks, 'Checklist')}
      </BubbleMenu>
      <EditorContent editor={editor} />
    </>
  )
}
