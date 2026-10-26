import { makeRng } from '../../../shared/loop/rng'
import { rgba, shade } from '../../../shared/loop/color'
import type { FrameStyle } from '../config'

/** 액자 바깥/안쪽 영역 (장면 600 기준) */
export const OUTER = { x: 80, y: 100, w: 440, h: 440 }
export const BORDER = 38
export const INNER = { x: OUTER.x + BORDER, y: OUTER.y + BORDER, w: OUTER.w - BORDER * 2, h: OUTER.h - BORDER * 2 }
export const NAIL = { x: 300, y: 36 }

const PALETTES: Record<FrameStyle, [string, string, string]> = {
  gold: ['#f6d77a', '#c9972b', '#8a6508'],
  wood: ['#c58b55', '#8a5a2b', '#5e3b1b'],
  white: ['#ffffff', '#e5e7eb', '#b6bdc9'],
}

export function innerClip(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.rect(INNER.x, INNER.y, INNER.w, INNER.h)
  ctx.clip()
}

/** 액자 안쪽: 캔버스 질감 배경 (seed 고정 무늬라 매 프레임 똑같음) */
export function drawCanvasBg(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(INNER.x, INNER.y, INNER.w, INNER.h)
  const rng = makeRng(3)
  ctx.save()
  innerClip(ctx)
  ctx.lineWidth = 1
  for (let i = 0; i < 90; i++) {
    const x = INNER.x + rng() * INNER.w
    const y = INNER.y + rng() * INNER.h
    ctx.strokeStyle = rng() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.18)'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 14 + rng() * 26, y)
    ctx.moveTo(x, y)
    ctx.lineTo(x, y + 14 + rng() * 26)
    ctx.stroke()
  }
  ctx.restore()
}

/** 액자 테두리: 겹친 그라데이션 + 그림자로 입체감 (border-image 없이) */
export function drawFrameBorder(ctx: CanvasRenderingContext2D, style: FrameStyle) {
  const [light, mid, dark] = PALETTES[style]
  const { x, y, w, h } = OUTER

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 8
  const g = ctx.createLinearGradient(x, y, x + w, y + h)
  g.addColorStop(0, light)
  g.addColorStop(0.5, mid)
  g.addColorStop(1, dark)
  ctx.fillStyle = g
  ctx.fillRect(x, y, w, h)
  ctx.restore()

  // 안쪽으로 한 겹씩 좁아지는 띠
  const bands: [number, string][] = [
    [0, shade(dark, -0.2)],
    [5, light],
    [14, mid],
    [22, shade(light, 0.2)],
    [30, dark],
  ]
  for (const [inset, color] of bands) {
    ctx.strokeStyle = color
    ctx.lineWidth = inset === 22 ? 4 : 6
    ctx.strokeRect(x + inset + 3, y + inset + 3, w - inset * 2 - 6, h - inset * 2 - 6)
  }
  // 장식 모서리 알
  ctx.fillStyle = shade(light, 0.25)
  for (const [cx, cy] of [
    [x + 18, y + 18],
    [x + w - 18, y + 18],
    [x + 18, y + h - 18],
    [x + w - 18, y + h - 18],
  ]) {
    ctx.beginPath()
    ctx.arc(cx, cy, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = dark
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
  // 안쪽 그림자(유리 안쪽 깊이감)
  ctx.save()
  innerClip(ctx)
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 16
  ctx.strokeRect(INNER.x, INNER.y, INNER.w, INNER.h)
  ctx.restore()
}

/** 못 + 끈: 액자 윗변 양쪽 모서리에서 못으로 모임 */
export function drawHanging(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#6b4a2b'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(OUTER.x + 60, OUTER.y + 4)
  ctx.lineTo(NAIL.x, NAIL.y)
  ctx.lineTo(OUTER.x + OUTER.w - 60, OUTER.y + 4)
  ctx.stroke()
  ctx.fillStyle = '#9ca3af'
  ctx.beginPath()
  ctx.arc(NAIL.x, NAIL.y, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#4b5563'
  ctx.lineWidth = 2
  ctx.stroke()
}

/** 유리: 대각선 흰색 반사 띠 (캐릭터 위에 반투명으로 얹힘) */
export function drawGlassReflection(ctx: CanvasRenderingContext2D) {
  ctx.save()
  innerClip(ctx)
  const { x, y, w, h } = INNER
  const g = ctx.createLinearGradient(x, y, x + w, y + h)
  g.addColorStop(0.28, 'rgba(255,255,255,0)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.28)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.06)')
  g.addColorStop(0.58, 'rgba(255,255,255,0.18)')
  g.addColorStop(0.7, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(x, y, w, h)
  ctx.restore()
}

/** 두드릴 때 유리에 퍼지는 동심원 파문 */
export function drawRipples(ctx: CanvasRenderingContext2D, cx: number, cy: number, list: { r: number; alpha: number }[], color: string) {
  ctx.save()
  innerClip(ctx)
  ctx.lineWidth = 3
  for (const rp of list) {
    ctx.strokeStyle = rgba(color, rp.alpha)
    ctx.beginPath()
    ctx.arc(cx, cy, rp.r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}
