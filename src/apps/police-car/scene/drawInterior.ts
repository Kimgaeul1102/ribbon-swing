import { makeRng } from '../../../shared/loop/rng'
import { shade } from '../../../shared/loop/color'
import { scrollOffset } from './motion'

export const WINDOW = { x: 70, y: 60, w: 460, h: 250 }
const TILE_W = 600 // 창밖 무늬 한 장의 폭. 루프당 이 폭의 정수 배만큼 흐름

type Building = { x: number; w: number; h: number; lit: number[] }
let farCache: Building[] | null = null

/** 먼 건물들(seed 고정, 한 번만 만듦) */
function farBuildings(): Building[] {
  if (farCache) return farCache
  const rng = makeRng(11)
  const list: Building[] = []
  let x = 0
  while (x < TILE_W) {
    const w = 40 + rng() * 50
    list.push({ x, w, h: 60 + rng() * 110, lit: Array.from({ length: 6 }, () => rng()) })
    x += w + 4 + rng() * 8
  }
  farCache = list
  return list
}

/** 차창 밖 밤 도시: 먼 건물(느림) + 가로등(빠름) 2겹 패럴랙스 */
export function drawWindowScene(ctx: CanvasRenderingContext2D, t: number, loop: number, cityColor: string) {
  const { x, y, w, h } = WINDOW
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 14)
  ctx.clip()

  const sky = ctx.createLinearGradient(0, y, 0, y + h)
  sky.addColorStop(0, '#0b1020')
  sky.addColorStop(1, '#2a2f55')
  ctx.fillStyle = sky
  ctx.fillRect(x, y, w, h)

  // 먼 건물: 루프당 1바퀴
  const far = scrollOffset(t, loop, 1, TILE_W)
  for (let tile = 0; tile < 3; tile++) {
    for (const b of farBuildings()) {
      const bx = x + far + tile * TILE_W + b.x - TILE_W
      if (bx > x + w || bx + b.w < x) continue
      ctx.fillStyle = cityColor
      ctx.fillRect(bx, y + h - b.h, b.w, b.h)
      ctx.fillStyle = 'rgba(253,224,71,0.55)'
      b.lit.forEach((v, i) => {
        if (v > 0.45) ctx.fillRect(bx + 8 + (i % 3) * (b.w / 3.4), y + h - b.h + 12 + Math.floor(i / 3) * 22, 6, 9)
      })
    }
  }

  // 가로등: 루프당 3바퀴라 더 빠르게 지나감 (200px 간격)
  const near = scrollOffset(t, loop, 3, TILE_W)
  for (let tile = 0; tile < 3; tile++) {
    for (let k = 0; k < 3; k++) {
      const lx = x + near + tile * TILE_W + k * 200 - TILE_W + 60
      if (lx > x + w + 20 || lx < x - 20) continue
      ctx.strokeStyle = shade(cityColor, -0.3)
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(lx, y + h)
      ctx.lineTo(lx, y + h - 130)
      ctx.lineTo(lx + 22, y + h - 138)
      ctx.stroke()
      const glow = ctx.createRadialGradient(lx + 24, y + h - 134, 2, lx + 24, y + h - 134, 40)
      glow.addColorStop(0, 'rgba(254,240,138,0.95)')
      glow.addColorStop(1, 'rgba(254,240,138,0)')
      ctx.fillStyle = glow
      ctx.fillRect(lx - 20, y + h - 180, 90, 90)
    }
  }
  ctx.restore()

  // 창틀 + 유리 반사
  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 14)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  ctx.beginPath()
  ctx.moveTo(x + 40, y)
  ctx.lineTo(x + 130, y)
  ctx.lineTo(x + 70, y + h)
  ctx.lineTo(x - 20, y + h)
  ctx.fill()
}

/** 차 안 벽 + 뒷좌석 등받이. 창 아래/캐릭터 뒤 */
export function drawCabin(ctx: CanvasRenderingContext2D) {
  const wall = ctx.createLinearGradient(0, 0, 0, 600)
  wall.addColorStop(0, '#1f2937')
  wall.addColorStop(1, '#111827')
  ctx.fillStyle = wall
  ctx.fillRect(0, 0, 600, 600)
}

export function drawSeatBack(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 290, 0, 600)
  g.addColorStop(0, '#374151')
  g.addColorStop(1, '#1f2937')
  ctx.fillStyle = g
  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(110, 290, 380, 330, [40, 40, 0, 0])
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 2
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.moveTo(150 + i * 100, 310)
    ctx.lineTo(150 + i * 100, 600)
    ctx.stroke()
  }
}

/** 앞좌석 사이 철망(격자) */
export function drawMesh(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 40, 90, 400)
  ctx.clip()
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fillRect(0, 40, 90, 400)
  ctx.strokeStyle = 'rgba(156,163,175,0.75)'
  ctx.lineWidth = 2
  for (let x = -40; x < 140; x += 14) {
    ctx.beginPath()
    ctx.moveTo(x, 40)
    ctx.lineTo(x + 400, 440)
    ctx.moveTo(x + 400, 40)
    ctx.lineTo(x, 440)
    ctx.stroke()
  }
  ctx.restore()
  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = 6
  ctx.strokeRect(0, 40, 90, 400)
}

/** 수갑: 고리 두 개 + 사슬. (x, y) = 두 손 사이 가운데 */
export function drawCuffs(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = '#d1d5db'
  ctx.lineWidth = 3.5
  ctx.beginPath()
  ctx.moveTo(x - 24, y)
  ctx.bezierCurveTo(x - 12, y + 12, x + 12, y + 12, x + 24, y)
  ctx.stroke()
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath()
    ctx.ellipse(x + i * 9, y + 8 - Math.abs(i) * 1.5, 5, 3, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.lineWidth = 6
  for (const cx of [x - 42, x + 42]) {
    ctx.strokeStyle = '#9ca3af'
    ctx.beginPath()
    ctx.arc(cx, y, 17, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, y, 17, Math.PI * 1.1, Math.PI * 1.6)
    ctx.stroke()
    ctx.lineWidth = 6
  }
}
