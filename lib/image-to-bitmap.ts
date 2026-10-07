import colorPalette from '../color-palette.json'

const SIZE = 64

const palette = colorPalette.allColors.map((color) => {
  if (color === 'transparent') return null
  const value = parseInt(color.slice(1), 16)
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
})

function nearestColor(r: number, g: number, b: number) {
  let best = 1
  let bestDistance = Number.POSITIVE_INFINITY
  for (let index = 1; index < palette.length; index++) {
    const color = palette[index]
    if (!color) continue
    const dr = r - color.r
    const dg = g - color.g
    const db = b - color.b
    const distance = dr * dr + dg * dg + db * db
    if (distance < bestDistance) {
      bestDistance = distance
      best = index
    }
  }
  return best
}

export function pixelsToBitmap(data: Uint8ClampedArray, size = SIZE) {
  let bitmap = ''
  for (let i = 0; i < size * size; i++) {
    const offset = i * 4
    const alpha = data[offset + 3]
    const index = alpha < 128 ? 0 : nearestColor(data[offset], data[offset + 1], data[offset + 2])
    bitmap += index.toString(16).padStart(2, '0')
  }
  return bitmap
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not read that picture.'))
    image.src = src
  })
}

export async function imageToBitmap(src: string) {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Could not read that picture.')
  ctx.clearRect(0, 0, SIZE, SIZE)
  if (!image.width || !image.height) throw new Error('That picture is empty.')
  const scale = Math.min(SIZE / image.width, SIZE / image.height)
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const x = Math.floor((SIZE - width) / 2)
  const y = Math.floor((SIZE - height) / 2)
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(image, x, y, width, height)
  return pixelsToBitmap(ctx.getImageData(0, 0, SIZE, SIZE).data)
}

export async function fileToProfilePicture(file: File) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    throw new Error('Please choose a picture file, like a PNG or JPG.')
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('That file is too big. Try a smaller picture.')
  }
  const src = URL.createObjectURL(file)
  try {
    const image = await loadImage(src)
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx || !image.width || !image.height) throw new Error('Could not read that picture.')
    const scale = Math.max(size / image.width, size / image.height)
    const width = image.width * scale
    const height = image.height * scale
    ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height)
    return canvas.toDataURL('image/jpeg', 0.85)
  } finally {
    URL.revokeObjectURL(src)
  }
}

export async function fileToBitmap(file: File) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    throw new Error('Please choose a picture file, like a PNG or JPG.')
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('That file is too big. Try a smaller picture.')
  }
  const src = URL.createObjectURL(file)
  try {
    return await imageToBitmap(src)
  } finally {
    URL.revokeObjectURL(src)
  }
}
