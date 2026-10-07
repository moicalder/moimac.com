function makeRandom(seed: number) {
  let value = seed % 2147483647
  if (value <= 0) value += 2147483646
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

export function drawAsteroid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  seed: number,
  spin: number
) {
  const rand = makeRandom(seed)
  const rocky = rand() > 0.45
  const cx = x + size / 2
  const cy = y + size / 2
  const radius = size * 0.46
  const points = size >= 64 ? 13 : 9

  ctx.beginPath()
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2 + spin
    const bump = radius * (0.72 + rand() * 0.34)
    const px = cx + Math.cos(angle) * bump
    const py = cy + Math.sin(angle) * bump
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()

  const light = rocky ? '#d7c4a4' : '#d5d0c8'
  const mid = rocky ? '#8a6a48' : '#7e7870'
  const shade = ctx.createRadialGradient(
    cx - radius * 0.32,
    cy - radius * 0.36,
    radius * 0.08,
    cx + radius * 0.1,
    cy + radius * 0.12,
    radius
  )
  shade.addColorStop(0, light)
  shade.addColorStop(0.42, mid)
  shade.addColorStop(1, '#241e1a')
  ctx.fillStyle = shade
  ctx.fill()
  ctx.strokeStyle = '#1a1512'
  ctx.lineWidth = Math.max(1, size / 30)
  ctx.stroke()

  const craters = 2 + Math.floor(rand() * (size >= 64 ? 4 : 2))
  for (let i = 0; i < craters; i++) {
    const angle = rand() * Math.PI * 2 + spin
    const dist = rand() * radius * 0.42
    const crater = radius * (0.1 + rand() * 0.2)
    const px = cx + Math.cos(angle) * dist
    const py = cy + Math.sin(angle) * dist
    ctx.beginPath()
    ctx.ellipse(px, py, crater, crater * 0.78, angle, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(28, 22, 18, 0.5)'
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(px - crater * 0.22, py - crater * 0.22, crater * 0.32, crater * 0.22, angle, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 244, 220, 0.2)'
    ctx.fill()
  }
}
