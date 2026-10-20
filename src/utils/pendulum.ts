/** 감쇠 진자: angle(t) = A · e^(−d·t) · sin(2π·f·t)  (t: 초, 결과: deg) */
export function pendulumAngle(t: number, amplitude: number, frequency: number, damping: number): number {
  return amplitude * Math.exp(-damping * t) * Math.sin(2 * Math.PI * frequency * t)
}

/** 각속도 (deg/s) — 해석적 미분 */
export function pendulumVelocity(t: number, amplitude: number, frequency: number, damping: number): number {
  const w = 2 * Math.PI * frequency
  return amplitude * Math.exp(-damping * t) * (w * Math.cos(w * t) - damping * Math.sin(w * t))
}

/**
 * 밀기 진동 — 레이어마다 감쇠 진동 상태(각도 x, 각속도 v)를 시뮬레이션한다.
 * 밀기는 처음부터 다시 시작하는 게 아니라 속도에 충격을 더하는 것이라 흔들리는 중에 또 눌러도 자연스럽게 이어진다.
 * 정지 상태에서 한 번 밀면 pendulumAngle(t)와 같은 궤적을 그린다.
 */
export const MAX_SWING_DEG = 70 // 여러 번 밀어도 이 각도를 크게 넘지 않게 속도에 상한

/** 진동수/감쇠/속도 배율 → 진동 파라미터. stepSpring(state, 0, dt, omega, zeta)로 진행한다 */
export function oscillator(frequency: number, damping: number, speedMul: number) {
  const w = 2 * Math.PI * frequency * speedMul // 감쇠 진동수 (rad/s)
  const d = damping * speedMul // 감쇠율 (1/s)
  const omega = Math.hypot(w, d) // 고유 각속도
  return { w, omega, zeta: d / omega }
}

/** 밀기 충격: 지금 움직이는 방향으로 속도를 더함 (멈춰 있으면 오른쪽). 세기=amplitude(deg) */
export function applyPush(state: { x: number; v: number }, amplitude: number, w: number): void {
  const dir = state.v >= 0 ? 1 : -1
  const vmax = Math.min(amplitude * 2.2, MAX_SWING_DEG) * w
  state.v = Math.max(-vmax, Math.min(vmax, state.v + dir * amplitude * w))
}

/**
 * 계속 흔들기: 밀지 않아도 자연스럽게 계속 이어지는 잔잔한 흔들림 (deg).
 * 서로 배수가 아닌 두 주기의 사인파를 섞고 세기도 천천히 오르내려서 기계처럼 반복되지 않는다.
 * seed(0~1)가 다르면 위상이 달라져 인원마다 따로 흔들린다. 결과는 항상 ±strength 이내.
 */
export function idleAngle(t: number, strength: number, frequency: number, seed: number): number {
  const w = 2 * Math.PI * frequency * 0.6 // 밀기 흔들림보다 느긋하게
  const p = seed * 2 * Math.PI
  const main = Math.sin(w * t + p)
  const second = Math.sin(w * 1.618 * t + p * 1.7 + 1)
  const breath = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.08 * t + p * 2.3)
  return strength * (0.75 * main + 0.25 * second) * breath
}

/*
 * 부드럽고 말랑한 움직임 — 전부 CSS transform(회전·기울임·늘어남)이라 GPU가 처리해서 가볍다.
 * (SVG 필터로 물결/휨을 그리는 방식은 매 프레임 다시 그려져서 렉이 심해 폐기)
 */
const SWAY_SKEW_GAIN = 14 // sway=1, sin(angle)=1일 때 아래쪽이 더 쏠리는 기울기 (deg)
const JELLY_STRETCH = 0.06 // wobble=1, 최대 속도일 때 세로로 늘어나는 비율
const JELLY_VELOCITY_REF = 120 // 각속도(deg/s)가 이 정도일 때 최대의 약 76%
const SPRING_OMEGA = 13 // 스프링 고유 각속도 (rad/s) — 클수록 빨리 따라옴
const SPRING_ZETA = 0.35 // 감쇠비 — 1 미만이면 목표를 살짝 넘었다 돌아오며 말랑하게 출렁임

/** 아래로 갈수록: 몸이 기운 쪽으로 아래쪽이 더 쏠리게 하는 기울임(skewX, deg). pivot이 위쪽이라 아래로 갈수록 많이 움직임 */
export function swaySkew(angleDeg: number, sway: number): number {
  return -Math.sin((angleDeg * Math.PI) / 180) * SWAY_SKEW_GAIN * sway
}

/** 말랑함: 빨리 움직일 때 세로로 늘어나는 비율 0~JELLY_STRETCH·wobble (멈추면 0). 가로는 부피 유지로 살짝 줄어듦 */
export function jellyStretch(wobble: number, angularVelocity: number): number {
  return wobble * JELLY_STRETCH * Math.tanh(Math.abs(angularVelocity) / JELLY_VELOCITY_REF)
}

/** 부족감쇠 스프링으로 목표를 따라감 (state를 직접 갱신) → 목표를 살짝 넘었다 돌아오며 말랑하게 출렁임. 서브스텝으로 안정적으로 적분 */
export function stepSpring(
  state: { x: number; v: number },
  target: number,
  dt: number,
  omega = SPRING_OMEGA,
  zeta = SPRING_ZETA,
): void {
  const n = Math.max(1, Math.ceil(dt * 120))
  const h = dt / n
  for (let i = 0; i < n; i++) {
    state.v += (omega * omega * (target - state.x) - 2 * zeta * omega * state.v) * h
    state.x += state.v * h
  }
}
