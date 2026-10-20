/** 감쇠 진자: angle(t) = A · e^(−d·t) · sin(2π·f·t)  (t: 초, 결과: deg) */
export function pendulumAngle(t: number, amplitude: number, frequency: number, damping: number): number {
  return amplitude * Math.exp(-damping * t) * Math.sin(2 * Math.PI * frequency * t)
}

/** 각속도 (deg/s) — 해석적 미분 */
export function pendulumVelocity(t: number, amplitude: number, frequency: number, damping: number): number {
  const w = 2 * Math.PI * frequency
  return amplitude * Math.exp(-damping * t) * (w * Math.cos(w * t) - damping * Math.sin(w * t))
}

/** 꿀렁임: 각속도에 비례한 skewX(deg)와 scaleY */
export function wobbleTransform(wobble: number, angularVelocity: number): { skew: number; scaleY: number } {
  return {
    skew: wobble * angularVelocity * 0.05,
    scaleY: 1 + wobble * Math.abs(angularVelocity) * 0.0005,
  }
}

/** 아래로 갈수록 더 흔들리는 효과: 이미지를 가로 띠로 나눠 띠마다 다르게 밀어 휘어 보이게 함 */
export const SWAY_STRIPS = 32
const SWAY_GAIN = 60 // sway=1, sin(angle)=1일 때 맨 아래 띠의 이동량 (이미지 너비 %)

/** depth(0=pivot, 1=맨 아래)에서의 목표 가로 이동량 (이미지 너비 %). 깊이의 제곱에 비례 → 아래쪽이 훨씬 많이 */
export function swayShift(angleDeg: number, depth: number, sway: number): number {
  return -Math.sin((angleDeg * Math.PI) / 180) * SWAY_GAIN * sway * depth * depth
}

/** 깊을수록 느슨한 스프링 계수(60fps 기준 프레임당) → 아래쪽이 더 늦게, 더 부드럽게 따라옴 */
export function swayStiffness(depth: number): number {
  return 0.4 - 0.32 * depth
}
