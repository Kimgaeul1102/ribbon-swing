import { TAU, cyclesPerLoop } from '../loop/curves'
import type { PartMotion } from './drawCharacter'

/** 앱이 알려주는 "몸의 움직임". 흔들림 레이어는 이것을 늦게 + 더 크게 따라감 (rot: 도, dx/dy: 장면 px) */
export type Drive = { rot: number; dx: number; dy: number }

export type Anim = {
  t: number
  loop: number
  /** 시간 t에서의 몸 움직임. 지연된 시간으로도 불려서 차이를 흔들림으로 씀 */
  drive?: (t: number) => Drive
  /** 흔들림 레이어도 같이 받는 기본 움직임 (몸에만 개별로 준 이동 등) */
  base?: PartMotion
}

export type SwaySettings = { strength: number; lag: number; speed: number; pivotX: number; pivotY: number }

/** 평소 살랑거림의 기본 주기(초) */
const IDLE_PERIOD = 2.2
/** 강도 1일 때 평소 살랑거림 각도(도) */
const IDLE_DEG = 2.5

const add = (a: number | undefined, b: number) => (a ?? 0) + b

/**
 * 흔들림 레이어의 움직임:
 * ① 평소 살랑거림 — 루프에 정수 번 들어가는 주기라 끝과 처음이 이어짐
 * ② 몸 움직임 따라가기 — (lag초 전 몸 움직임 − 지금 몸 움직임) × 강도. 늦게, 그리고 강도만큼 더 크게
 */
export function swayMotion(s: SwaySettings, anim: Anim): PartMotion {
  const { t, loop } = anim
  const k = cyclesPerLoop(loop, IDLE_PERIOD / Math.max(s.speed, 0.1))
  const phase = (TAU * k * (t - s.lag)) / loop
  // 두 번째 파동(정수 배 주파수)을 섞어 기계처럼 일정하지 않게
  const idle = s.strength * IDLE_DEG * (Math.sin(phase) * 0.8 + Math.sin(phase * 2 + 1.3) * 0.2)

  let rot = idle
  let dx = 0
  let dy = 0
  if (anim.drive) {
    const now = anim.drive(t)
    const past = anim.drive(t - s.lag)
    rot += s.strength * (past.rot - now.rot)
    dx += s.strength * (past.dx - now.dx)
    dy += s.strength * (past.dy - now.dy)
  }
  const b = anim.base
  return { ...b, rot: add(b?.rot, rot), dx: add(b?.dx, dx), dy: add(b?.dy, dy), px: s.pivotX, py: s.pivotY }
}

/** 이미 정해진 움직임(앱이 준 것)에 흔들림을 더함: 이동/회전은 합, 확대는 곱, 기준점은 흔들림 쪽 */
export function combineMotion(a: PartMotion | undefined, b: PartMotion): PartMotion {
  return {
    dx: add(a?.dx, b.dx ?? 0),
    dy: add(a?.dy, b.dy ?? 0),
    rot: add(a?.rot, b.rot ?? 0),
    sx: (a?.sx ?? 1) * (b.sx ?? 1),
    sy: (a?.sy ?? 1) * (b.sy ?? 1),
    px: b.px ?? a?.px,
    py: b.py ?? a?.py,
  }
}
