const MAX_BYTES = 2.3 * 1024 * 1024

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function compressImage(file: File, maxSide = 1600): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.')
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => {
    throw new Error('This image could not be read. Try a JPG or PNG.')
  })

  for (const side of [maxSide, 1200, 900]) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Your browser cannot process images.')
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    for (const quality of [0.82, 0.7]) {
      let blob = await toBlob(canvas, 'image/webp', quality)
      if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality + 0.05)
      if (blob && blob.size <= MAX_BYTES) {
        bitmap.close()
        return readAsDataUrl(blob)
      }
    }
  }
  bitmap.close()
  throw new Error('This image is too large even after compression.')
}
