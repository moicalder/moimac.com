export const WORLD_WIDTH = 400
export const WORLD_HEIGHT = 560
const GRAVITY = 2100
const JUMP_VELOCITY = 830
const MOVE_SPEED = 280
const PLAYER_WIDTH = 34
const START_Y = 160

export type JoyInput = {
  left: boolean
  right: boolean
  up: boolean
}

export type Platform = {
  x: number
  y: number
  w: number
  vx: number
  color: string
  breakable: boolean
  crumble: number | null
}

export type Cloud = { x: number; y: number; s: number }
export type Star = { x: number; y: number; s: number }

export type Player = {
  x: number
  y: number
  vy: number
  facing: number
  grounded: boolean
  coyote: number
  platform: Platform | null
}

export type JoyWorld = {
  player: Player
  platforms: Platform[]
  clouds: Cloud[]
  stars: Star[]
  camera: number
  generatedUntil: number
  maxY: number
  platformCount: number
}

const PLATFORM_COLORS = ['#6bcb77', '#4cc9f0', '#ffb703', '#ff7ab6', '#7d8cff', '#f4a261']

export function scoreFor(world: JoyWorld) {
  return Math.max(0, Math.floor(world.maxY - START_Y))
}

export function createWorld(): JoyWorld {
  const ground: Platform = {
    x: 0,
    y: START_Y,
    w: WORLD_WIDTH,
    vx: 0,
    color: '#6bcb77',
    breakable: false,
    crumble: null,
  }
  const world: JoyWorld = {
    player: {
      x: WORLD_WIDTH / 2,
      y: START_Y,
      vy: 0,
      facing: 1,
      grounded: true,
      coyote: 0,
      platform: ground,
    },
    platforms: [ground],
    clouds: [],
    stars: [],
    camera: 0,
    generatedUntil: START_Y,
    maxY: START_Y,
    platformCount: 1,
  }
  extendWorld(world, START_Y + WORLD_HEIGHT + 400)
  return world
}

function extendWorld(world: JoyWorld, limit: number) {
  let previous = world.platforms[world.platforms.length - 1]
  while (world.generatedUntil < limit) {
    const t = Math.min(1, world.generatedUntil / 3200)
    const gap = world.platformCount <= 2 ? 88 : 100 + t * 40
    const y = previous.y + gap
    const w = world.platformCount <= 1 ? 150 : Math.max(64, 136 - t * 56)
    const shift = 100 + t * 40
    const prevCenter = previous.x + previous.w / 2
    let center = prevCenter + (Math.random() * 2 - 1) * shift
    center = Math.max(w / 2 + 12, Math.min(WORLD_WIDTH - w / 2 - 12, center))
    const moving = y > 900 && Math.random() < 0.12 + t * 0.15
    const breakable = world.platformCount > 3 && !moving && Math.random() < 0.34
    const platform: Platform = {
      x: center - w / 2,
      y,
      w,
      vx: moving ? (Math.random() < 0.5 ? -52 : 52) : 0,
      color: breakable ? '#c4844a' : PLATFORM_COLORS[world.platformCount % PLATFORM_COLORS.length],
      breakable,
      crumble: null,
    }
    world.platforms.push(platform)
    world.platformCount += 1
    world.generatedUntil = y
    previous = platform

    if (world.clouds.length === 0 || y - world.clouds[world.clouds.length - 1].y > 170) {
      world.clouds.push({
        x: 30 + Math.random() * (WORLD_WIDTH - 90),
        y: y + 40,
        s: 0.7 + Math.random() * 0.8,
      })
    }
    if (y > 3800 && Math.random() < 0.7) {
      world.stars.push({
        x: Math.random() * WORLD_WIDTH,
        y: y + Math.random() * 80,
        s: Math.random() < 0.5 ? 2 : 3,
      })
    }
  }
}

function overlaps(x: number, platform: Platform) {
  const left = x - PLAYER_WIDTH / 2
  const right = x + PLAYER_WIDTH / 2
  return right > platform.x && left < platform.x + platform.w
}

export function stepJoyWorld(world: JoyWorld, input: JoyInput, dt: number): 'ok' | 'dead' {
  const player = world.player

  for (const platform of world.platforms) {
    if (platform.vx === 0) continue
    platform.x += platform.vx * dt
    if (platform.x < 10 || platform.x + platform.w > WORLD_WIDTH - 10) {
      platform.vx *= -1
      platform.x = Math.max(10, Math.min(WORLD_WIDTH - platform.w - 10, platform.x))
    }
  }

  if (input.left) player.facing = -1
  if (input.right) player.facing = 1

  let speed = 0
  if (input.left) speed -= MOVE_SPEED
  if (input.right) speed += MOVE_SPEED
  if (player.grounded && player.platform) speed += player.platform.vx
  player.x += speed * dt
  const half = PLAYER_WIDTH / 2
  if (player.x < half) player.x = half
  if (player.x > WORLD_WIDTH - half) player.x = WORLD_WIDTH - half

  if (player.grounded && player.platform) {
    const gone = player.platform.crumble !== null && player.platform.crumble <= 0
    const stillOn = !gone && overlaps(player.x, player.platform) && player.platform.y >= world.camera - 4
    if (stillOn) {
      player.y = player.platform.y
      player.vy = 0
      player.coyote = 0.1
    } else {
      if (player.platform.breakable) player.platform.crumble = 0
      player.grounded = false
      player.platform = null
    }
  }

  if (!player.grounded) {
    player.coyote = Math.max(0, player.coyote - dt)
    player.vy = Math.max(-1100, player.vy - GRAVITY * dt)
    const previousY = player.y
    player.y += player.vy * dt

    if (player.vy <= 0) {
      for (const platform of world.platforms) {
        if (platform.crumble !== null && platform.crumble <= 0) continue
        if (platform.y < world.camera - 4) continue
        if (!overlaps(player.x, platform)) continue
        if (previousY >= platform.y && player.y <= platform.y) {
          player.y = platform.y
          player.vy = 0
          player.grounded = true
          player.platform = platform
          player.coyote = 0.1
          if (platform.breakable && platform.crumble === null) platform.crumble = 0.45
          break
        }
      }
    }
  }

  if (input.up && (player.grounded || player.coyote > 0)) {
    if (player.platform?.breakable) player.platform.crumble = 0
    player.vy = JUMP_VELOCITY
    player.grounded = false
    player.platform = null
    player.coyote = 0
  }

  for (const platform of world.platforms) {
    if (platform.crumble !== null && platform.crumble > 0) platform.crumble -= dt
  }

  if (player.y > world.maxY) world.maxY = player.y

  const difficulty = Math.min(1, Math.max(0, (world.maxY - START_Y) / 2500))
  const margin = WORLD_HEIGHT * (0.42 - difficulty * 0.1)
  const follow = player.y - margin
  if (follow > world.camera) world.camera = follow

  extendWorld(world, world.camera + WORLD_HEIGHT + 500)
  world.platforms = world.platforms.filter((platform) => {
    if (platform.crumble !== null && platform.crumble <= 0) return false
    return platform.y > world.camera - 40
  })
  world.clouds = world.clouds.filter((cloud) => cloud.y > world.camera - 80)
  if (player.platform && !world.platforms.includes(player.platform)) {
    player.grounded = false
    player.platform = null
  }

  if (!player.grounded && player.y < world.camera) return 'dead'
  return 'ok'
}
