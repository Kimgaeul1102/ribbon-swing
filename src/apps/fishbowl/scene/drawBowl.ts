import { TAU } from '../../../shared/loop/curves'
import { rgba } from '../../../shared/loop/color'

export const BOWL = { cx: 300, cy: 330, rx: 230, ry: 245, surface: 190 }

function clipBowl(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.ellipse(BOWL.cx, BOWL.cy, BOWL.rx, BOWL.ry, 0, 0, TAU)
  ctx.clip()
}

/** 어항 뒷면: 물(수면 물결) + 모래 + 수초. 캐릭터 뒤에 깔림 */
export function drawBowlBack(ctx: CanvasRenderingContext2D, u: number, waterColor: string) {
  ctx.save()
  clipBowl(ctx)

  // 물: 위쪽이 물결치는 면. 물결은 루프당 정수 번 이동해서 끊김이 없음
  ctx.fillStyle = rgba(waterColor, 0.45)
  ctx.beginPath()
  ctx.moveTo(0, BOWL.surface)
  for (let x = 0; x <= 600; x += 10) ctx.lineTo(x, BOWL.surface + 3 * Math.sin(x / 38 + TAU * u))
  ctx.lineTo(600, 600)
  ctx.lineTo(0, 600)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 3
  ctx.beginPath()
  for (let x = 0; x <= 600; x += 10) {
    const y = BOWL.surface + 3 * Math.sin(x / 38 + TAU * u)
    if (x === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // 모래 바닥
  ctx.fillStyle = '#f3e0a8'
  ctx.beginPath()
  ctx.moveTo(0, 600)
  ctx.lineTo(0, 530)
  ctx.quadraticCurveTo(150, 505, 300, 520)
  ctx.quadraticCurveTo(450, 535, 600, 510)
  ctx.lineTo(600, 600)
  ctx.closePath()
  ctx.fill()

  // 수초 3개: 한 루프에 한 번 살랑
  const plants = [
    { x: 180, h: 110 },
    { x: 245, h: 150 },
    { x: 420, h: 125 },
  ]
  ctx.strokeStyle = '#4ade80'
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  plants.forEach((p, i) => {
    const sway = 10 * Math.sin(TAU * u + i * 1.7)
    ctx.beginPath()
    ctx.moveTo(p.x, 525)
    ctx.quadraticCurveTo(p.x + sway * 0.5, 525 - p.h * 0.5, p.x + sway, 525 - p.h)
    ctx.stroke()
  })
  ctx.restore()
}

/** 어항 앞면: 유리 테두리, 하이라이트, 캐릭터 상단에 굴절된 밝은 띠 */
export function drawBowlFront(ctx: CanvasRenderingContext2D) {
  ctx.save()
  clipBowl(ctx)
  const g = ctx.createLinearGradient(0, BOWL.surface - 70, 0, BOWL.surface + 90)
  g.addColorStop(0, 'rgba(255,255,255,0.0)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, BOWL.surface - 70, 600, 160)
  ctx.restore()

  ctx.strokeStyle = 'rgba(255,255,255,0.75)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.ellipse(BOWL.cx, BOWL.cy, BOWL.rx, BOWL.ry, 0, 0, TAU)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(120,160,190,0.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(BOWL.cx, BOWL.cy, BOWL.rx + 4, BOWL.ry + 4, 0, 0, TAU)
  ctx.stroke()

  // 왼쪽 위 유리 반사
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.ellipse(BOWL.cx, BOWL.cy, BOWL.rx - 16, BOWL.ry - 16, 0, Math.PI * 1.1, Math.PI * 1.4)
  ctx.stroke()
}
