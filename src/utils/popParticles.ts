/**
 * 뿅뿅 효과의 조각들과 움직임. 화면(PopEffect.tsx, CSS 애니메이션)과 영상/GIF 저장(canvas)이 같은 값을 쓴다.
 * popPose는 index.css의 @keyframes pop-burst + `0.9s ease-out`과 같은 값을 계산한다.
 */
export const POP_DURATION_MS = 900

export type PopParticle = {
  glyph: string
  dx: number // 끝 위치 (px, 가운데 기준)
  dy: number
  color: string
  delay: number // ms
  size: number // rem
  bold: boolean
}

const GLYPHS = ['✦', '♥', '★', '♪', '✿', '♥', '✦', '★']
const COLORS = ['#ec4899', '#f472b6', '#fb923c', '#facc15', '#a78bfa']

/** "뿅!" 글자 — 위쪽으로 튀어나옴 */
export const POP_BUBBLE: PopParticle = { glyph: '뿅!', dx: 0, dy: -60, color: '#ec4899', delay: 0, size: 1.6, bold: true }

// 가운데에서 사방으로 퍼지는 조각들 (각도·거리는 고정값이라 매번 같은 움짤이 나옴)
export const POP_PARTICLES: PopParticle[] = GLYPHS.map((glyph, i) => {
  const angle = (i / GLYPHS.length) * Math.PI * 2 - Math.PI / 2
  const radius = i % 2 === 0 ? 90 : 65
  return {
    glyph,
    dx: Math.round(Math.cos(angle) * radius),
    dy: Math.round(Math.sin(angle) * radius),
    color: COLORS[i % COLORS.length],
    delay: (i % 3) * 40,
    size: 1.2,
    bold: false,
  }
})

/** CSS `ease-out` = cubic-bezier(0, 0, 0.58, 1) */
export function easeOut(p: number): number {
  if (p <= 0) return 0
  if (p >= 1) return 1
  const bezier = (t: number, a: number, b: number) => 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t
  let lo = 0
  let hi = 1
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (bezier(mid, 0, 0.58) < p) lo = mid
    else hi = mid
  }
  return bezier((lo + hi) / 2, 0, 1)
}

/** 애니메이션 시작 후 elapsedMs 시점의 조각 위치(가운데 기준 px)·크기·투명도. 시작 전/끝난 뒤는 안 보임 */
export function popPose(elapsedMs: number, p: Pick<PopParticle, 'dx' | 'dy'>) {
  if (elapsedMs < 0 || elapsedMs >= POP_DURATION_MS) return { x: 0, y: 0, scale: 0, opacity: 0 }
  const t = elapsedMs / POP_DURATION_MS
  // 0% → 25%: 작게 시작해 1.4배로 커지며 60% 지점까지 / 25% → 100%: 0.9배로 줄며 끝 지점까지 퍼지고 사라짐
  if (t < 0.25) {
    const q = easeOut(t / 0.25)
    return { x: p.dx * 0.6 * q, y: p.dy * 0.6 * q, scale: 1.4 * q, opacity: q }
  }
  const q = easeOut((t - 0.25) / 0.75)
  const f = 0.6 + 0.4 * q
  return { x: p.dx * f, y: p.dy * f, scale: 1.4 - 0.5 * q, opacity: 1 - q }
}
