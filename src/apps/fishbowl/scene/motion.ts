import { TAU, frac } from '../../../shared/loop/curves'
import { makeRng } from '../../../shared/loop/rng'

/** 위아래 부유: 루프당 1회 왕복 (px) */
export const bob = (t: number, loop: number, amp: number) => amp * Math.sin((TAU * t) / loop)

/** 좌우 기울기: 부유와 90° 위상차 (도) */
export const tilt = (t: number, loop: number, deg: number) => deg * Math.sin((TAU * t) / loop + Math.PI / 2)

export type Bubble = { phase: number; size: number; wobblePhase: number; wobbleAmp: number }

/** 거품이 올라가는 데 걸리는 시간 (루프 비율). 나머지 시간엔 안 보임 */
export const RISE = 0.55

/** 거품 설정: seed로만 정해지므로 Math.random 없이 매번 같은 거품 */
export function makeBubbles(count: number, seed: number): Bubble[] {
  const rng = makeRng(seed)
  return Array.from({ length: count }, (_, i) => ({
    phase: (i + rng() * 0.6) / count,
    size: 4 + rng() * 6,
    wobblePhase: rng() * 6.28,
    wobbleAmp: 4 + rng() * 6,
  }))
}

/** 거품의 진행(0 = 입에서 막 나옴, 1 = 수면). 지금 안 보이면 null. 루프당 정확히 한 번 올라감 */
export function bubbleProgress(b: Bubble, u: number): number | null {
  const local = frac(u - b.phase)
  return local < RISE ? local / RISE : null
}
