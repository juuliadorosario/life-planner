import { useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, Plus, Quote, Trash2, Type } from 'lucide-react'
import { Page, PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { useToast } from '@/app/toast'
import type { CreativeItem } from '@/db/repositories/creative'
import { fileToResizedDataUrl } from '@/lib/images'
import { cn } from '@/lib/utils'
import { useCreativeActions, useCreativeItems } from './hooks'

/**
 * Creativity: a moodboard of images, writing and quotes, grouped in boards.
 * Add images with the button, by dropping files on the page or by pasting
 * (⌘V). Text saves when you click away.
 */
const DEFAULT_BOARD = 'Moodboard'

export function CreativityPage() {
  const { data: items = [] } = useCreativeItems()
  const actions = useCreativeActions()
  const toast = useToast()
  const [board, setBoard] = useState(DEFAULT_BOARD)
  const [newBoard, setNewBoard] = useState<string | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const boards = useMemo(() => [...new Set([DEFAULT_BOARD, ...items.map((i) => i.board), board])], [items, board])
  const shown = items.filter((i) => i.board === board)

  const addImages = async (files: Iterable<File>) => {
    const images = [...files].filter((f) => f.type.startsWith('image/'))
    for (const file of images) {
      actions.add.mutate({ board, kind: 'image', image: await fileToResizedDataUrl(file) })
    }
    if (images.length) toast(images.length === 1 ? 'Image added' : `${images.length} images added`)
  }

  const addText = (kind: 'text' | 'quote') =>
    actions.add.mutate({ board, kind, text: '' }, { onSuccess: (row) => setFocusId(row.id) })

  // ⌘V an image anywhere on the page (text fields keep their normal paste).
  const addImagesRef = useRef(addImages)
  useEffect(() => {
    addImagesRef.current = addImages
  })
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, [contenteditable]')) return
      const files = [...(e.clipboardData?.files ?? [])]
      if (files.length) {
        e.preventDefault()
        void addImagesRef.current(files)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  const commitNewBoard = () => {
    const name = newBoard?.trim()
    setNewBoard(null)
    if (name) setBoard(name)
  }

  return (
    <Page wide>
      <PageHeader
        eyebrow="Creativity"
        title={board}
        description="Images, writing and ideas. Drop or paste images anywhere."
        actions={
          <>
            <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void addImages(e.target.files ?? []); e.target.value = '' }} />
            <Button variant="outline" onClick={() => addText('quote')}>
              <Quote /> Quote
            </Button>
            <Button variant="outline" onClick={() => addText('text')}>
              <Type /> Write
            </Button>
            <Button onClick={() => fileInput.current?.click()}>
              <ImagePlus /> Add images
            </Button>
          </>
        }
      />

      <div className="-mt-3 mb-6 flex flex-wrap items-center gap-1">
        {boards.map((b) => (
          <button
            key={b}
            onClick={() => setBoard(b)}
            className={cn('h-7 rounded-full px-3 text-[12.5px] transition-colors', board === b ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
          >
            {b}
          </button>
        ))}
        {newBoard === null ? (
          <button onClick={() => setNewBoard('')} className="flex h-7 items-center gap-1 rounded-full px-2.5 text-[12.5px] text-faint transition-colors hover:bg-muted hover:text-foreground">
            <Plus className="size-3.5" /> Board
          </button>
        ) : (
          <input
            autoFocus
            value={newBoard}
            onChange={(e) => setNewBoard(e.target.value)}
            onBlur={commitNewBoard}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitNewBoard()
              if (e.key === 'Escape') setNewBoard(null)
            }}
            placeholder="Board name"
            className="h-7 w-36 rounded-full border border-border bg-card px-3 text-[12.5px] outline-none focus:border-primary/40"
          />
        )}
      </div>

      <div
        className={cn('relative min-h-[420px] rounded-xl transition-shadow', dragging && 'ring-2 ring-primary ring-offset-4 ring-offset-background')}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          void addImages(e.dataTransfer.files)
        }}
      >
        {shown.length ? (
          <div className="columns-2 gap-3 md:columns-3 xl:columns-4">
            {shown.map((item) => (
              <BoardItem key={item.id} item={item} autoFocus={item.id === focusId} />
            ))}
          </div>
        ) : (
          <button
            onClick={() => fileInput.current?.click()}
            className="flex h-[420px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-[repeating-linear-gradient(135deg,transparent,transparent_7px,var(--border)_7px,var(--border)_8px)] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ImagePlus className="size-5" strokeWidth={1.5} />
            <span className="display text-[18px] text-foreground">Start your {board.toLowerCase() === 'moodboard' ? 'moodboard' : `“${board}” board`}</span>
            <span className="text-[13px]">Drop images here, paste them with ⌘V, or write something.</span>
          </button>
        )}
      </div>
    </Page>
  )
}

function BoardItem({ item, autoFocus }: { item: CreativeItem; autoFocus: boolean }) {
  const { update, remove } = useCreativeActions()
  // Only this card edits its text, so the draft never needs resyncing.
  const [draft, setDraft] = useState(item.text)

  const save = () => {
    if (draft === item.text) return
    update.mutate({ id: item.id, patch: { text: draft } })
  }
  // A text card left empty disappears when you click away.
  const saveOrDrop = () => {
    if (item.kind !== 'image' && !draft.trim()) remove.mutate(item.id)
    else save()
  }

  const tools = (
    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover/item:opacity-100">
      {item.kind !== 'image' && (
        <button
          onClick={() => update.mutate({ id: item.id, patch: { kind: item.kind === 'quote' ? 'text' : 'quote' } })}
          className="grid size-7 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60"
          aria-label={item.kind === 'quote' ? 'Show as text' : 'Show as quote'}
          title={item.kind === 'quote' ? 'Show as text' : 'Show as quote'}
        >
          {item.kind === 'quote' ? <Type className="size-3.5" /> : <Quote className="size-3.5" />}
        </button>
      )}
      <button onClick={() => remove.mutate(item.id)} className="grid size-7 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60" aria-label="Delete">
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )

  if (item.kind === 'image') {
    return (
      <figure className="group/item relative mb-3 break-inside-avoid overflow-hidden rounded-lg bg-card">
        {tools}
        <img src={item.image ?? ''} alt={item.text} draggable={false} className="photo block w-full" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          placeholder="Add a caption"
          className={cn(
            'w-full bg-transparent px-3 py-2 text-[12.5px] text-muted-foreground outline-none placeholder:text-faint',
            !item.text && 'absolute inset-x-0 bottom-0 bg-card/90 opacity-0 backdrop-blur-sm transition-opacity group-hover/item:opacity-100 focus:opacity-100',
          )}
        />
      </figure>
    )
  }

  const quote = item.kind === 'quote'
  return (
    <div className={cn('group/item relative mb-3 break-inside-avoid rounded-lg', quote ? 'bg-foreground px-6 py-7 text-background' : 'border border-border bg-card p-4 shadow-card')}>
      {tools}
      <textarea
        autoFocus={autoFocus}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={saveOrDrop}
        placeholder={quote ? 'A line you want to keep…' : 'Write…'}
        className={cn(
          'field-sizing-content block min-h-12 w-full resize-none bg-transparent outline-none',
          quote ? 'display text-[22px] leading-[1.2] placeholder:text-background/40' : 'text-[14px] leading-relaxed placeholder:text-faint',
        )}
      />
    </div>
  )
}
