/**
 * 불 효과 — 화면(Fire.tsx의 canvas)과 저장(export/renderScene.ts)이 같은 그리기 함수를 쓴다.
 * 불꽃은 시간(초)만으로 정해지는 순수 함수라서 몇 번을 그려도 같은 모양이 나온다.
 */

/** 불꽃 크기: 열 너비/무대 높이 대비 비율, 위치: 그림 맨 아래(정지 상태)에서 조금 아래가 불꽃 밑면 */
export const FIRE_WIDTH_RATIO = 0.6
export const FIRE_HEIGHT_RATIO = 0.22
export const FIRE_BASE_OFFSET = 0.02

/** 익는 속도: 불을 켜면 이 시간(초)에 약 63%까지 익음 */
export const COOK_TAU_SEC = 12

/** 익은 정도(0~1)를 dt초만큼 진행. 불이 꺼지면 익은 상태가 그대로 유지됨 */
export function cookStep(level: number, fireOn: boolean, dt: number): number {
  if (!fireOn) return level
  return level + (1 - level) * (1 - Math.exp(-dt / COOK_TAU_SEC))
}

/** 익은 정도에 맞는 필터 (노릇하게 → 까맣게). 0이면 'none' */
export function cookFilter(level: number): string {
  const l = Math.round(Math.min(1, Math.max(0, level)) * 100) / 100 // 값이 자주 바뀌지 않게 100단계
  if (l <= 0) return 'none'
  return `sepia(${(0.85 * l).toFixed(2)}) saturate(${(1 + 0.4 * l).toFixed(2)}) brightness(${(1 - 0.6 * l).toFixed(2)})`
}

// 화면에서 보이는 익은 정도 (React state가 아니라 루프가 갱신 — 저장할 때 시작값으로 읽음)
let cook = 0
export const getCook = () => cook
export const setCook = (v: number) => {
  cook = v
}

const TONGUES = 7
const LAYERS = [
  { color: '#ef4444', scale: 1, alpha: 0.9 },
  { color: '#fb923c', scale: 0.78, alpha: 0.95 },
  { color: '#fbbf24', scale: 0.55, alpha: 1 },
  { color: '#fef9c3', scale: 0.3, alpha: 1 },
]

/** (0,0)~(w,h) 안에 불꽃을 그린다. 밑면이 y=h, tSec은 아무 기준 시간(초) */
export function drawFlames(ctx: CanvasRenderingContext2D, w: number, h: number, tSec: number): void {
  ctx.save()
  // 바닥의 불빛
  // 가로 반지름 w/2에서 0이 되는 타원형 그라데이션 (세로로 눌러서 가장자리에 네모 테두리가 안 보이게)
  const R = w / 2
  ctx.save()
  ctx.translate(w / 2, h)
  ctx.scale(1, (h * 0.6) / R)
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, R)
  glow.addColorStop(0, 'rgba(251,146,60,0.55)')
  glow.addColorStop(1, 'rgba(251,146,60,0)')
  ctx.fillStyle = glow
  ctx.fillRect(-R, -R, w, R)
  ctx.restore()

  for (let i = 0; i < TONGUES; i++) {
    const u = i / (TONGUES - 1)
    const phase = i * 1.9
    const speed = 5 + (i % 3) * 1.7
    // 가운데가 높고 가장자리가 낮음 + 불규칙한 일렁임
    const flicker = 0.78 + 0.22 * Math.sin(tSec * speed + phase) + 0.1 * Math.sin(tSec * speed * 2.3 + phase * 1.3)
    const th = h * (0.5 + 0.5 * Math.sin(Math.PI * u)) * flicker
    const tw = (w / TONGUES) * 1.9
    const cx = w * (0.1 + 0.8 * u)
    const sway = Math.sin(tSec * (speed * 0.7) + phase) * w * 0.035
    for (const L of LAYERS) {
      const lh = th * L.scale
      const lw = tw * (0.4 + 0.6 * L.scale)
      ctx.globalAlpha = L.alpha
      ctx.fillStyle = L.color
      ctx.beginPath()
      ctx.moveTo(cx - lw / 2, h)
      ctx.bezierCurveTo(cx - lw / 2, h - lh * 0.45, cx - lw * 0.15 + sway, h - lh * 0.65, cx + sway, h - lh)
      ctx.bezierCurveTo(cx + lw * 0.15 + sway, h - lh * 0.65, cx + lw / 2, h - lh * 0.45, cx + lw / 2, h)
      ctx.closePath()
      ctx.fill()
    }
  }
  ctx.restore()
}
