import { TAU, wrap } from '../../../shared/loop/curves'

/** 한 번 두드릴 때 톡톡 2연타 사이 간격(초) */
export const TAP_GAP = 0.18
/** 흔들림이 사라지는 데 걸리는 시간 상수(초). 약 2초에 걸쳐 감쇠 */
const SWAY_TAU = 0.6
const SWAY_FREQ = 1.3 // Hz
const SWAY_PER_TAP = 0.8 // 한 번 톡 칠 때 흔들림(도)
export const RIPPLE_LIFE = 0.7
const HAND_PULSE = 0.12

/** 두드리는 시각 목록 → 모든 톡(탭) 시각 */
export const tapTimes = (knockTimes: number[], loop: number): number[] =>
  knockTimes.flatMap((k) => [wrap(k, loop), wrap(k + TAP_GAP, loop)])

/**
 * 어떤 톡 이후 경과 시간들. 지난 루프의 톡 여파도 이어지도록 이전 반복(m)까지 같이 계산하므로
 * 루프 끝과 처음이 자연스럽게 이어짐
 */
function ages(tap: number, t: number, loop: number, maxAge: number): number[] {
  const out: number[] = []
  for (let m = 0; m <= Math.ceil(maxAge / loop); m++) {
    const age = t - tap + m * loop
    if (age >= 0 && age <= maxAge) out.push(age)
  }
  return out
}

/** 액자 흔들림 각도(도): 톡마다 감쇠하는 진동이 쌓임 */
export function frameSway(t: number, loop: number, knockTimes: number[]): number {
  let sum = 0
  for (const tap of tapTimes(knockTimes, loop)) {
    for (const age of ages(tap, t, loop, SWAY_TAU * 6)) {
      sum += SWAY_PER_TAP * Math.exp(-age / SWAY_TAU) * Math.sin(TAU * SWAY_FREQ * age)
    }
  }
  return sum
}

/** 지금 퍼지고 있는 파문들: 반지름과 투명도 */
export function ripples(t: number, loop: number, knockTimes: number[]): { r: number; alpha: number }[] {
  const out: { r: number; alpha: number }[] = []
  for (const tap of tapTimes(knockTimes, loop)) {
    for (const age of ages(tap, t, loop, RIPPLE_LIFE)) {
      const k = age / RIPPLE_LIFE
      out.push({ r: 8 + age * 130, alpha: 0.65 * (1 - k) })
      if (age > 0.12) out.push({ r: 8 + (age - 0.12) * 130, alpha: 0.4 * (1 - k) })
    }
  }
  return out
}

/** 톡 순간의 손/몸 움직임 세기 0~1 (톡마다 짧게 튀었다 돌아옴) */
export function tapPulse(t: number, loop: number, knockTimes: number[]): number {
  let best = 0
  for (const tap of tapTimes(knockTimes, loop)) {
    for (const age of ages(tap, t, loop, HAND_PULSE)) best = Math.max(best, Math.sin((Math.PI * age) / HAND_PULSE))
  }
  return best
}

/** 두드리는 중인지: 첫 톡 직전부터 끝난 뒤까지 눈을 감음 */
export function isKnocking(t: number, loop: number, knockTimes: number[]): boolean {
  return knockTimes.some((k) => {
    const local = wrap(t - (k - 0.05), loop)
    return local < TAP_GAP + 0.4
  })
}
