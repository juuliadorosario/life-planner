/** Read an image file, scale it down and re-encode (JPEG by default), so SQLite stays small. */
export async function fileToResizedDataUrl(file: File, maxSize = 1400, quality = 0.84, type: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL(type, quality)
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

/**
 * An image for a note. Photos become JPEG; PNG and WebP (charts, diagrams,
 * screenshots) stay PNG to keep sharp edges and transparency; SVGs and small
 * GIFs are kept as they are, so drawings stay crisp and GIFs keep moving.
 */
export async function fileToNoteImage(file: File): Promise<string> {
  if (file.type === 'image/svg+xml') return readAsDataUrl(file)
  if (file.type === 'image/gif' && file.size <= 4_000_000) return readAsDataUrl(file)
  if (file.type === 'image/png' || file.type === 'image/webp') return fileToResizedDataUrl(file, 1800, undefined, 'image/png')
  return fileToResizedDataUrl(file, 1800)
}
