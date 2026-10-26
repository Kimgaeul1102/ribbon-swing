/** 루프 애니메이션용 수학 도우미. 모든 함수는 시간(t초)과 루프 길이(loop초)만으로 값이 정해지는 순수 함수 */
export const TAU = Math.PI * 2
export const rad = (deg: number) => (deg * Math.PI) / 180

export const frac = (x: number) => x - Math.floor(x)
export const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k
export const smooth = (x: number) => {
  const k = clamp(x, 0, 1)
  return k * k * (3 - 2 * k)
}

/** t를 [0, loop) 안으로 (음수도 OK) */
export const wrap = (t: number, loop: number) => ((t % loop) + loop) % loop

/** 구간 [start, start+dur) 안에서의 진행률 0~1. 구간 밖이면 null. 루프 경계를 넘어가는 구간도 이어짐 */
export function windowProgress(t: number, loop: number, start: number, dur: number): number | null {
  const local = wrap(t - start, loop)
  return local < dur ? local / dur : null
}

/** 구간 안에서 0→1→0으로 부드럽게 올라갔다 내려오는 종 모양 값 (구간 밖은 0) */
export function bump(t: number, loop: number, start: number, dur: number): number {
  const p = windowProgress(t, loop, start, dur)
  return p === null ? 0 : Math.sin(Math.PI * p) ** 2
}

/** 한 루프에 정수 번 반복되는 주기를 고름: 목표 주기(초)에 가장 가까우면서 루프에 딱 맞는 반복 횟수 */
export const cyclesPerLoop = (loop: number, periodSec: number) => Math.max(1, Math.round(loop / periodSec))

/** 눈 깜빡임: 루프 중 1회, durSec 동안 감김 */
export function isBlinking(t: number, loop: number, at: number, durSec = 0.12): boolean {
  return windowProgress(t, loop, at, durSec) !== null
}
