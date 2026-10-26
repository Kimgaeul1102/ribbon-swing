import { TAU, cyclesPerLoop, frac, windowProgress } from '../../../shared/loop/curves'

/** 루프 동안 경광등이 몇 바퀴(빨강→파랑) 도는지. 정수라서 끝과 처음 색이 같음 */
export const lightCycles = (loop: number, speed: number) => cyclesPerLoop(loop, 1 / Math.max(speed, 0.1))

/** 경광등 단계 0~1. 0.5 미만이면 빨강, 이상이면 파랑 */
export const lightPhase = (t: number, loop: number, speed: number) => frac((lightCycles(loop, speed) * t) / loop)

/** 차 진동 (px, ±1) */
export const carShake = (t: number, loop: number) => Math.sin((TAU * cyclesPerLoop(loop, 0.25) * t) / loop)

/** 고개 돌리기: 루프 중 1회, 0.6초 동안 -6°까지 돌았다가 복귀 (도) */
export const TURN_DUR = 0.6
export function headTurn(t: number, loop: number, at: number): number {
  const p = windowProgress(t, loop, at * loop, TURN_DUR)
  return p === null ? 0 : -6 * Math.sin(Math.PI * p) ** 2
}

/** 한숨: 루프 중 1회, 몸 세로 배율 1 → 1.03 → 0.98 → 1 */
export const SIGH_DUR = 0.9
export function sighScale(t: number, loop: number, at: number): number {
  const p = windowProgress(t, loop, at * loop, SIGH_DUR)
  if (p === null) return 1
  return p < 0.45 ? 1 + 0.03 * Math.sin((Math.PI * p) / 0.45) : 1 - 0.02 * Math.sin((Math.PI * (p - 0.45)) / 0.55)
}

/** 창밖 흐름: 한 루프에 무늬 폭(600px)의 정수 배만큼 이동 (왼쪽으로). cycles 클수록 빠름 */
export const scrollOffset = (t: number, loop: number, cycles: number, patternW: number) => -frac((cycles * t) / loop) * patternW
