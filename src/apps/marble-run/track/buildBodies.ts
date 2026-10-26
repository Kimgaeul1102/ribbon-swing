import Matter from 'matter-js'
import { WORLD_W, type Rect, type TrackItem } from '../types'

const { Bodies, Body, Constraint } = Matter

const THICK = 14 // 바닥판/벽 두께
const rad = (deg: number) => (deg * Math.PI) / 180

export type SeesawInfo = { body: Matter.Body }
export type SpinnerInfo = { body: Matter.Body; speed: number }

export type TrackBodies = {
  bodies: Matter.Body[]
  constraints: Matter.Constraint[]
  seesaws: SeesawInfo[]
  spinners: SpinnerInfo[]
}

/** 트랙 요소 배열 → Matter 바디. rng는 시소·바람개비 초기 각도처럼 "seed에서 파생되는 값"에 씀 */
export function buildTrack(items: TrackItem[], worldH: number, rng: () => number): TrackBodies {
  const out: TrackBodies = { bodies: [], constraints: [], seesaws: [], spinners: [] }
  const add = (b: Matter.Body) => {
    out.bodies.push(b)
    return b
  }

  // 월드 테두리: 양옆 벽 + 바닥 (골인 뒤에 구슬이 떨어지지 않게)
  const edge = { isStatic: true, label: 'wall', friction: 0.01 }
  add(Bodies.rectangle(-THICK / 2, worldH / 2, THICK, worldH + 400, edge))
  add(Bodies.rectangle(WORLD_W + THICK / 2, worldH / 2, THICK, worldH + 400, edge))
  add(Bodies.rectangle(WORLD_W / 2, worldH + THICK / 2, WORLD_W + THICK * 2, THICK, edge))

  for (const it of items) {
    switch (it.type) {
      case 'ramp':
        add(Bodies.rectangle(it.x, it.y, it.w, THICK, { isStatic: true, angle: rad(it.angle), label: 'ramp', friction: 0.01 }))
        break
      case 'wall':
        add(Bodies.rectangle(it.x, it.y, it.w, it.h, { isStatic: true, label: 'wall', friction: 0.01 }))
        break
      case 'funnel': {
        // V자: 양쪽 반이 가운데(gap)를 향해 내려감
        const half = (it.w - it.gap) / 2
        const drop = half * 0.5
        const len = Math.hypot(half, drop)
        const ang = Math.atan2(drop, half)
        const cy = it.y + drop / 2
        const opts = { isStatic: true, label: 'funnel', friction: 0.01 }
        add(Bodies.rectangle(it.x - (it.gap + half) / 2, cy, len, THICK, { ...opts, angle: ang }))
        add(Bodies.rectangle(it.x + (it.gap + half) / 2, cy, len, THICK, { ...opts, angle: -ang }))
        break
      }
      case 'bumper':
        add(Bodies.circle(it.x, it.y, it.r, { isStatic: true, label: 'bumper', restitution: it.restitution }))
        break
      case 'seesaw': {
        const body = add(
          Bodies.rectangle(it.x, it.y, it.w, THICK, {
            label: 'seesaw',
            angle: (rng() - 0.5) * 0.4,
            density: 0.004,
            friction: 0.01,
          }),
        )
        out.constraints.push(
          Constraint.create({ pointA: { x: it.x, y: it.y }, bodyB: body, pointB: { x: 0, y: 0 }, length: 0, stiffness: 1 }),
        )
        out.seesaws.push({ body })
        break
      }
      case 'spinner': {
        // 십자: 가로 막대 + 세로 막대를 한 바디로
        const bar = (w: number, h: number) => Bodies.rectangle(it.x, it.y, w, h)
        const body = Body.create({
          parts: [bar(it.size, THICK), bar(THICK, it.size)],
          isStatic: true,
          label: 'spinner',
          friction: 0.01,
        })
        Body.setAngle(body, rng() * Math.PI)
        out.spinners.push({ body, speed: it.speed })
        add(body)
        break
      }
      case 'goal':
        add(Bodies.rectangle(it.x, it.y, it.w, it.h, { isStatic: true, isSensor: true, label: 'goal' }))
        break
    }
  }
  return out
}

/** 시작 영역 안에서 seed 기반으로 겹치지 않게 위치 뽑기 */
export function pickStartPoints(area: Rect, count: number, radius: number, rng: () => number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = []
  const minDist = radius * 2.1
  const clear = (p: { x: number; y: number }) => pts.every((q) => Math.hypot(q.x - p.x, q.y - p.y) >= minDist)
  for (let i = 0; i < count; i++) {
    let p = { x: area.x + rng() * area.w, y: area.y + rng() * area.h }
    for (let tries = 0; tries < 60 && !clear(p); tries++) {
      p = { x: area.x + rng() * area.w, y: area.y + rng() * area.h }
    }
    // 자리가 모자라면 위로 쌓아서 겹침 방지
    if (!clear(p)) p = { x: p.x, y: area.y - (i + 1) * minDist }
    pts.push(p)
  }
  return pts
}
