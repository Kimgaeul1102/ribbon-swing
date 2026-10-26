import type { ShelfConfig } from '../config'

/** 병/캔 유리 안쪽 영역 (캐릭터를 이 모양으로 잘라 보여줌). 위쪽 lidH만큼은 뚜껑 */
export const LID_H = 24

export function innerPath(ctx: CanvasRenderingContext2D, x: number, boardY: number, w: number, h: number, shape: ShelfConfig['jarShape']) {
  const top = boardY - h + LID_H
  ctx.beginPath()
  ctx.roundRect(x - w / 2 + 4, top, w - 8, boardY - top - 2, shape === 'jar' ? [16, 16, 14, 14] : 6)
}

/** 병 뒷면: 반투명 유리 바탕 (캐릭터 뒤) */
export function drawJarBack(ctx: CanvasRenderingContext2D, x: number, boardY: number, w: number, h: number, shape: ShelfConfig['jarShape']) {
  innerPath(ctx, x, boardY, w, h, shape)
  ctx.fillStyle = 'rgba(210,235,255,0.35)'
  ctx.fill()
}

/** 병 앞면: 유리 테두리/하이라이트 + 뚜껑 + 라벨 */
export function drawJarFront(
  ctx: CanvasRenderingContext2D,
  x: number,
  boardY: number,
  w: number,
  h: number,
  shape: ShelfConfig['jarShape'],
  name: string,
  font: string,
) {
  // 유리 테두리 + 세로 하이라이트
  innerPath(ctx, x, boardY, w, h, shape)
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.strokeStyle = 'rgba(120,160,190,0.4)'
  ctx.lineWidth = 1
  ctx.stroke()
  const top = boardY - h + LID_H
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.beginPath()
  ctx.roundRect(x - w / 2 + 12, top + 14, 7, (boardY - top) * 0.6, 4)
  ctx.fill()

  // 금속 뚜껑 (캔이면 위아래 금속 띠)
  const lid = ctx.createLinearGradient(0, boardY - h, 0, boardY - h + LID_H)
  lid.addColorStop(0, '#e5e7eb')
  lid.addColorStop(0.5, '#9ca3af')
  lid.addColorStop(1, '#d1d5db')
  ctx.fillStyle = lid
  ctx.strokeStyle = '#6b7280'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  const lidW = shape === 'jar' ? w * 0.78 : w - 4
  ctx.roundRect(x - lidW / 2, boardY - h, lidW, LID_H, 5)
  ctx.fill()
  ctx.stroke()
  if (shape === 'can') {
    ctx.beginPath()
    ctx.roundRect(x - lidW / 2, boardY - 12, lidW, 12, 4)
    ctx.fill()
    ctx.stroke()
  }

  // 라벨: 이름 글자가 라벨 폭에 맞게 줄어듦
  const lw = w * 0.82
  const lh = Math.min(38, h * 0.2)
  const ly = boardY - h * 0.22 - lh / 2
  ctx.fillStyle = '#fffdf5'
  ctx.strokeStyle = '#d6c9a8'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(x - lw / 2, ly, lw, lh, 4)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#4b3b2a'
  ctx.font = `bold ${Math.round(lh * 0.5)}px ${font}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name, x, ly + lh / 2 + 1, lw - 10)
}

/** 선반 판자 + 판자 아래 그림자 */
export function drawBoard(ctx: CanvasRenderingContext2D, y: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.08)'
  ctx.fillRect(24, y + 22, 552, 18)
  const g = ctx.createLinearGradient(0, y, 0, y + 22)
  g.addColorStop(0, '#d9a066')
  g.addColorStop(1, '#a8703a')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.roundRect(16, y, 568, 22, 4)
  ctx.fill()
  ctx.strokeStyle = '#7a4d22'
  ctx.lineWidth = 2
  ctx.stroke()
}
