import type Matter from 'matter-js'
import type { MarbleSim } from '../sim/marbleSim'
import { WORLD_W } from '../types'
import { getImage } from './imageCache'

const COLORS: Record<string, string> = {
  ramp: '#f9a8d4',
  wall: '#f9a8d4',
  funnel: '#c4b5fd',
  bumper: '#fcd34d',
  seesaw: '#6ee7b7',
  spinner: '#93c5fd',
}

function pathBody(ctx: CanvasRenderingContext2D, body: Matter.Body) {
  // 여러 조각으로 된 바디(바람개비)는 parts[0]이 합본이라 1번부터 그림
  const parts = body.parts.length > 1 ? body.parts.slice(1) : [body]
  for (const p of parts) {
    ctx.moveTo(p.vertices[0].x, p.vertices[0].y)
    for (let i = 1; i < p.vertices.length; i++) ctx.lineTo(p.vertices[i].x, p.vertices[i].y)
    ctx.closePath()
  }
}

/** 트랙 그리기. overlay가 있으면 그 그림을 깔고 물리 바디(충돌체)는 숨김 */
export function drawTrack(ctx: CanvasRenderingContext2D, sim: MarbleSim, overlaySrc: string | null) {
  const worldH = sim.config.preset.worldH
  const overlay = overlaySrc ? getImage(overlaySrc) : null
  if (overlay) ctx.drawImage(overlay, 0, 0, WORLD_W, worldH)

  for (const body of sim.track.bodies) {
    if (body.label === 'goal') {
      drawGoal(ctx, body)
      continue
    }
    if (overlay) continue
    ctx.beginPath()
    pathBody(ctx, body)
    ctx.fillStyle = COLORS[body.label] ?? '#f9a8d4'
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  // 시소 축
  if (!overlay) {
    ctx.fillStyle = '#374151'
    for (const c of sim.track.constraints) {
      if (!c.pointA) continue
      ctx.beginPath()
      ctx.arc(c.pointA.x, c.pointA.y, 5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

/** 골인 라인: 체크 무늬 띠 + GOAL 글자 (그림을 깔아도 위치를 알 수 있게 항상 그림) */
function drawGoal(ctx: CanvasRenderingContext2D, body: Matter.Body) {
  const { min, max } = body.bounds
  const w = max.x - min.x
  const h = max.y - min.y
  const cell = h / 2
  for (let i = 0; i * cell < w; i++) {
    for (let j = 0; j < 2; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? '#111827' : '#ffffff'
      ctx.fillRect(min.x + i * cell, min.y + j * cell, Math.min(cell, w - i * cell), cell)
    }
  }
  ctx.fillStyle = '#111827'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('GOAL', (min.x + max.x) / 2, min.y - 6)
}
