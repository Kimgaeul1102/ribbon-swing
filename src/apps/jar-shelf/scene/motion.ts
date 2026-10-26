import { TAU, bump, cyclesPerLoop, windowProgress, wrap } from '../../../shared/loop/curves'
import { makeRng } from '../../../shared/loop/rng'

/** 캐릭터 사이 위상 차이(초) */
export const PHASE_STEP = 0.37
/** 숨쉬기 한 번의 목표 주기(초) */
export const BREATH_PERIOD = 1.5

/** 캐릭터 i의 숨쉬기 세로 배율: 1 → 1.02 → 1. 주기를 루프에 정수 번 들어가게 보정해서 끊김이 없음 */
export function breathScale(t: number, loop: number, i: number): number {
  const k = cyclesPerLoop(loop, BREATH_PERIOD)
  return 1 + 0.01 * (1 - Math.cos((TAU * k * (t - i * PHASE_STEP)) / loop))
}

/** 캐릭터 i의 깜빡임 시점(초): 기본 시점에서 캐릭터마다 어긋나게 */
export const blinkTime = (loop: number, blinkAt: number, i: number) => wrap(blinkAt * loop + i * PHASE_STEP, loop)

/** 이번에 병을 두드리는 캐릭터 (seed로 고정) */
export function pickKnocker(count: number, seed: number): number {
  return Math.floor(makeRng(seed)() * count)
}

export const KNOCK_DUR = 0.5

/** 두드리는 캐릭터의 좌우 흔들림: ±2px, 두 번 톡톡 */
export function knockDx(t: number, loop: number, at: number): number {
  const p = windowProgress(t, loop, at * loop, KNOCK_DUR)
  return p === null ? 0 : 2 * Math.sin(TAU * 2 * p) * Math.sin(Math.PI * p)
}

/** 두드릴 때 유리(병)도 아주 살짝 떨림 */
export const knockGlassShake = (t: number, loop: number, at: number) => 0.8 * bump(t, loop, at * loop, KNOCK_DUR)
