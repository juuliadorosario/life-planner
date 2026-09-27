import { useRef, useState } from 'react'
import { ImagePlus, RefreshCw, X } from 'lucide-react'
import { useToast } from '@/app/toast'
import { fileToResizedDataUrl } from '@/lib/images'
import { cn } from '@/lib/utils'
import { usePhotoActions, usePhotoSlots } from './hooks'

/**
 * A place for a photo. Empty: a quiet placeholder you can click or drop an
 * image on. Filled: the photo, with change/remove on hover.
 */
export function PhotoSlot({
  slot,
  className,
  rounded = 'rounded-lg',
  placeholder = 'Add photo',
  compact,
  fallback,
  fallbackNode,
}: {
  slot: string
  /** Photo ref (`builtin:<key>`) to show when nothing is set for this slot. */
  fallback?: string
  /** Designed content to show when there is no photo (instead of the placeholder). */
  fallbackNode?: React.ReactNode
  className?: string
  rounded?: string
  placeholder?: string
  /** Hide the placeholder label (for small slots). */
  compact?: boolean
}) {
  const { resolve } = usePhotoSlots()
  const { upload, clear } = usePhotoActions()
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const photo = resolve(slot, fallback)

  const handle = async (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const dataUrl = await fileToResizedDataUrl(file)
    upload.mutate({ slot, dataUrl, name: file.name }, { onSuccess: () => toast('Photo added') })
  }

  return (
    <div
      className={cn('group/photo relative overflow-hidden', rounded, className)}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        void handle(e.dataTransfer.files[0])
      }}
    >
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => void handle(e.target.files?.[0])} />
      {photo ? (
        <>
          <img
            src={photo.src}
            alt=""
            draggable={false}
            className={cn('photo size-full transition-transform duration-700 ease-out-soft group-hover/photo:scale-[1.03]', photo.fit === 'contain' ? cn('object-contain', !photo.bg && 'bg-white p-[6%]') : 'object-cover')}
            style={{ objectPosition: photo.position, background: photo.bg }}
          />
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover/photo:opacity-100">
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); input.current?.click() }} className="grid size-7 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60" aria-label="Change photo">
              <RefreshCw className="size-3.5" />
            </button>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); clear.mutate(slot) }} className="grid size-7 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60" aria-label="Remove photo">
              <X className="size-3.5" />
            </button>
          </div>
        </>
      ) : fallbackNode ? (
        <>
          {fallbackNode}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              input.current?.click()
            }}
            className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-black/25 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/photo:opacity-100 hover:bg-black/40"
            aria-label="Add photo"
          >
            <ImagePlus className="size-3.5" />
          </button>
        </>
      ) : (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            input.current?.click()
          }}
          className={cn(
            'flex size-full flex-col items-center justify-center gap-1.5 bg-[repeating-linear-gradient(135deg,transparent,transparent_7px,var(--border)_7px,var(--border)_8px)] text-faint transition-colors hover:text-muted-foreground',
            'bg-muted/60',
          )}
        >
          <ImagePlus className="size-4" strokeWidth={1.5} />
          {!compact && <span className="font-display text-[12px]">{placeholder}</span>}
        </button>
      )}
      {dragging && <div className={cn('pointer-events-none absolute inset-0 ring-2 ring-primary ring-inset', rounded)} />}
    </div>
  )
}
