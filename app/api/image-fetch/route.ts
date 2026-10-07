import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 5 * 1024 * 1024

function isPrivateIp(ip: string) {
  const normalized = ip.toLowerCase().replace(/^::ffff:/, '')
  if (normalized === '::1' || normalized === '0.0.0.0') return true
  if (normalized.startsWith('fe80:') || normalized.startsWith('fc') || normalized.startsWith('fd')) return true
  if (isIP(normalized) === 4) {
    const [a, b] = normalized.split('.').map(Number)
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true
  }
  return false
}

async function publicUrl(raw: string) {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error('That link does not look right.')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('The link needs to start with http:// or https://.')
  }
  if (parsed.username || parsed.password) {
    throw new Error('That link cannot be used.')
  }
  const host = parsed.hostname.replace(/^\[|\]$/g, '')
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    /^\d+$/.test(host)
  ) {
    throw new Error('That link cannot be used.')
  }
  const ips = isIP(host) ? [host] : (await lookup(host, { all: true })).map((entry) => entry.address)
  if (ips.length === 0 || ips.some(isPrivateIp)) {
    throw new Error('That link cannot be used.')
  }
  return parsed.toString()
}

function sniffImage(bytes: Uint8Array) {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png'
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'image/gif'
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

async function readLimited(response: Response) {
  const length = Number(response.headers.get('content-length') || 0)
  if (length > MAX_BYTES) throw new Error('That picture is too big.')
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Could not open that picture.')
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BYTES) throw new Error('That picture is too big.')
    chunks.push(value)
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const start = typeof body.url === 'string' ? body.url.trim() : ''
    if (!start) {
      return NextResponse.json({ error: 'Paste a picture link first.' }, { status: 400 })
    }

    let current = start
    let response: Response | null = null
    for (let hop = 0; hop < 4; hop++) {
      current = await publicUrl(current)
      response = await fetch(current, {
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
        headers: { Accept: 'image/*', 'User-Agent': 'MoiMac/1.0' },
      })
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (!location) throw new Error('Could not open that link.')
        current = new URL(location, current).toString()
        continue
      }
      break
    }

    if (!response || !response.ok) {
      return NextResponse.json({ error: 'Could not open that link.' }, { status: 400 })
    }

    const bytes = await readLimited(response)
    const type = sniffImage(bytes)
    if (!type) {
      return NextResponse.json(
        { error: 'That link is not a picture. Try a PNG, JPG, GIF, or WEBP.' },
        { status: 400 }
      )
    }

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not open that link.'
    const safe = message.startsWith('That') || message.startsWith('The') || message.startsWith('Could')
      ? message
      : 'Could not open that link.'
    return NextResponse.json({ error: safe }, { status: 400 })
  }
}
