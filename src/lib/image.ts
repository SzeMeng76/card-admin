const MAX_BASE64_BYTES = 700_000 // stays comfortably under Bitnob's ~1MB total request-body limit

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function canvasToBase64(canvas: HTMLCanvasElement, quality: number): string {
  const dataUri = canvas.toDataURL('image/jpeg', quality)
  return dataUri.split(',')[1] || ''
}

/**
 * Re-encodes an image client-side as JPEG, lowering quality (and if needed,
 * dimensions) until the base64 payload fits under MAX_BASE64_BYTES.
 * Bitnob's KYC endpoint silently 401s past ~1MB total request body, so any
 * upload — regardless of source resolution — is normalized to a safe size.
 */
export async function compressImageToBase64(file: File): Promise<string> {
  const img = await loadImage(file)
  let width = img.naturalWidth
  let height = img.naturalHeight

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  let quality = 0.85
  let base64 = ''

  for (let attempt = 0; attempt < 8; attempt++) {
    canvas.width = width
    canvas.height = height
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)
    base64 = canvasToBase64(canvas, quality)

    if (base64.length <= MAX_BASE64_BYTES) break

    if (quality > 0.4) {
      quality -= 0.15
    } else {
      width = Math.round(width * 0.75)
      height = Math.round(height * 0.75)
    }
  }

  URL.revokeObjectURL(img.src)
  return base64
}
