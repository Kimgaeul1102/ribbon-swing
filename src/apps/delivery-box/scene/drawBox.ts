import { rad } from '../../../shared/loop/curves'
import { shade } from '../../../shared/loop/color'

/** 박스 바닥은 벨트 위(528)에 고정. 앞면 윗선(cutY)이 바뀌면 앞면 높이가 달라짐 */
export const BOX_BOTTOM = 528
export const BOX = { left: 150, right: 450, backTop: -48 /* 뒷면 윗선이 앞면 윗선보다 위로 올라간 정도 */, depthInset: 22 }

/** 박스 뒷면(안쪽) + 열린 뚜껑. 캐릭터 뒤에 깔림 */
export function drawBoxBack(ctx: CanvasRenderingContext2D, cutY: number, color: string, lidRot: number) {
  const top = cutY + BOX.backTop
  // 뚜껑(양옆으로 열린 두 장): 뒷면 윗모서리를 축으로 ±3° 펄럭
  const flap = (x: number, dir: 1 | -1) => {
    ctx.save()
    ctx.translate(x, top)
    ctx.rotate(rad(dir * (-38 + lidRot)))
    ctx.fillStyle = shade(color, 0.15)
    ctx.strokeStyle = shade(color, -0.35)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.rect(dir === 1 ? 0 : -110, -12, 110, 12)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }
  flap(BOX.left + BOX.depthInset, -1)
  flap(BOX.right - BOX.depthInset, 1)

  // 안쪽 어두운 면
  ctx.fillStyle = shade(color, -0.55)
  ctx.beginPath()
  ctx.moveTo(BOX.left + BOX.depthInset, top)
  ctx.lineTo(BOX.right - BOX.depthInset, top)
  ctx.lineTo(BOX.right, cutY)
  ctx.lineTo(BOX.left, cutY)
  ctx.closePath()
  ctx.fill()
}

/** 박스 앞면 + 옆면 + 테이프 + 스티커. 캐릭터 하반신을 가림(z-index 위) */
export function drawBoxFront(ctx: CanvasRenderingContext2D, cutY: number, color: string, label: string) {
  const { left, right } = BOX
  const bottom = BOX_BOTTOM
  const height = bottom - cutY

  // 양옆 면(살짝 어둡게)
  ctx.fillStyle = shade(color, -0.22)
  ctx.beginPath()
  ctx.moveTo(left, cutY)
  ctx.lineTo(left + BOX.depthInset, cutY + BOX.backTop)
  ctx.lineTo(left + BOX.depthInset, bottom - 14)
  ctx.lineTo(left, bottom)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(right, cutY)
  ctx.lineTo(right - BOX.depthInset, cutY + BOX.backTop)
  ctx.lineTo(right - BOX.depthInset, bottom - 14)
  ctx.lineTo(right, bottom)
  ctx.closePath()
  ctx.fill()

  // 앞면
  ctx.fillStyle = color
  ctx.strokeStyle = shade(color, -0.4)
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.rect(left, cutY, right - left, height)
  ctx.fill()
  ctx.stroke()
  // 윗선 안쪽 접힌 부분
  ctx.fillStyle = shade(color, 0.1)
  ctx.fillRect(left + 2, cutY + 2, right - left - 4, 12)

  // 테이프
  ctx.fillStyle = 'rgba(235,220,180,0.9)'
  ctx.fillRect(288, cutY, 24, height * 0.55)

  // 취급주의 스티커
  ctx.save()
  ctx.translate(left + 20, cutY + Math.max(14, (height - 44) / 2))
  ctx.rotate(rad(-4))
  ctx.fillStyle = '#fff7d6'
  ctx.strokeStyle = '#d97706'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(0, 0, 100, 44, 6)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#b45309'
  ctx.font = 'bold 18px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 50, 23, 90)
  ctx.restore()

  drawFragileIcon(ctx, right - 70, cutY + Math.max(8, (height - 60) / 2))
}

/** FRAGILE 아이콘: 빨간 삼각형 안에 와인잔 (도형으로만) */
function drawFragileIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.moveTo(x + 25, y)
  ctx.lineTo(x + 50, y + 44)
  ctx.lineTo(x, y + 44)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x + 17, y + 17)
  ctx.lineTo(x + 33, y + 17)
  ctx.lineTo(x + 25, y + 28)
  ctx.closePath()
  ctx.moveTo(x + 25, y + 28)
  ctx.lineTo(x + 25, y + 37)
  ctx.moveTo(x + 19, y + 37)
  ctx.lineTo(x + 31, y + 37)
  ctx.stroke()
  ctx.fillStyle = '#ef4444'
  ctx.font = 'bold 9px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('FRAGILE', x + 25, y + 56)
}

/** 퇴장할 때 박스 뒤로 길게 남는 속도선 ("슝") */
export function drawSpeedLines(ctx: CanvasRenderingContext2D, cutY: number, strength: number) {
  if (strength <= 0.02) return
  const len = 40 + 160 * strength
  ctx.save()
  ctx.strokeStyle = `rgba(255,255,255,${0.75 * Math.min(strength, 1)})`
  ctx.lineCap = 'round'
  const h = BOX_BOTTOM - cutY
  for (let i = 0; i < 4; i++) {
    const y = cutY + h * (0.12 + i * 0.25)
    ctx.lineWidth = 3 + (i % 2) * 2
    ctx.beginPath()
    ctx.moveTo(BOX.left - 8 - (i % 2) * 22, y)
    ctx.lineTo(BOX.left - 8 - len + (i % 2) * 22, y)
    ctx.stroke()
  }
  ctx.restore()
}

/** 컨베이어 벨트: 가로 줄무늬가 오른쪽으로 흘러 박스를 실어 나름. offset은 무늬 폭 안의 위치(0 ≤ offset < patternW) */
export function drawBelt(ctx: CanvasRenderingContext2D, offset: number, patternW: number) {
  const top = 520
  ctx.fillStyle = '#374151'
  ctx.fillRect(0, top, 600, 70)
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, top, 600, 70)
  ctx.clip()
  ctx.fillStyle = '#4b5563'
  for (let x = offset - patternW; x < 600 + patternW; x += patternW) ctx.fillRect(x, top, patternW / 2, 70)
  ctx.restore()
  ctx.fillStyle = '#1f2937'
  ctx.fillRect(0, top, 600, 8)
  ctx.fillRect(0, top + 62, 600, 8)
}
