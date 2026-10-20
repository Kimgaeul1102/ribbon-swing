/** 감쇠 진자: angle(t) = A · e^(−d·t) · sin(2π·f·t)  (t: 초, 결과: deg) */
export function pendulumAngle(t: number, amplitude: number, frequency: number, damping: number): number {
  return amplitude * Math.exp(-damping * t) * Math.sin(2 * Math.PI * frequency * t)
}

/** 각속도 (deg/s) — 해석적 미분 */
export function pendulumVelocity(t: number, amplitude: number, frequency: number, damping: number): number {
  const w = 2 * Math.PI * frequency
  return amplitude * Math.exp(-damping * t) * (w * Math.cos(w * t) - damping * Math.sin(w * t))
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
