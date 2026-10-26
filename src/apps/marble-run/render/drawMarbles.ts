import type { Character } from '../types'
import { getImage } from './imageCache'

/** 구슬 한 개 그리기. 그림이 있으면 원형으로 잘라 넣고, 없으면 색 구슬 + 이름 첫 글자 */
export function drawMarble(
  ctx: CanvasRenderingContext2D,
  c: Pick<Character, 'name' | 'color' | 'src'>,
  x: number,
  y: number,
  r: number,
  angle: number,
  rotateSprite: boolean,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.closePath()

  const img = c.src ? getImage(c.src) : null
  if (img) {
    ctx.save()
    ctx.clip()
    // rotateSprite가 꺼져 있으면 바디만 굴러가고 그림은 항상 정면
    if (rotateSprite) ctx.rotate(angle)
    // 짧은 변에 맞춰 꽉 채움(cover)
    const s = (r * 2) / Math.min(img.naturalWidth, img.naturalHeight)
    ctx.drawImage(img, (-img.naturalWidth * s) / 2, (-img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s)
    ctx.restore()
  } else {
    ctx.fillStyle = c.color
    ctx.fill()
    ctx.save()
    if (rotateSprite) ctx.rotate(angle)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = `bold ${Math.round(r)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText([...c.name][0] ?? '?', 0, 1)
    ctx.restore()
  }

  // 테두리(캐릭터 색)
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.lineWidth = 2
  ctx.strokeStyle = c.color
  ctx.stroke()
  ctx.restore()
}
