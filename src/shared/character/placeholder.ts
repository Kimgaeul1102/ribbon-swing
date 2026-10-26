import type { PartName } from './types'

export const PH_W = 400
export const PH_H = 600

type Parts = Partial<Record<PartName, HTMLCanvasElement>>
let cached: Parts | null = null

function layer(draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = PH_W
  c.height = PH_H
  const ctx = c.getContext('2d')!
  draw(ctx)
  return c
}

/**
 * 파츠를 아직 안 올렸을 때 보여주는 임시 캐릭터(미리보기용). 파츠가 층별로 나뉘어 있어서
 * 머리카락 지연, 눈 깜빡임 같은 움직임을 그대로 확인할 수 있음. 실제 그림을 올리면 바로 대체됨
 */
export function getPlaceholderParts(): Parts {
  if (cached) return cached
  cached = {
    body: layer((g) => {
      g.fillStyle = '#f9a8d4'
      g.beginPath()
      g.roundRect(110, 340, 180, 250, 60)
      g.fill()
    }),
    head: layer((g) => {
      g.fillStyle = '#ffe4d1'
      g.beginPath()
      g.arc(200, 230, 115, 0, Math.PI * 2)
      g.fill()
    }),
    hair: layer((g) => {
      g.fillStyle = '#7c4a2d'
      g.beginPath()
      g.arc(200, 215, 125, Math.PI, 0)
      g.lineTo(325, 300)
      g.quadraticCurveTo(300, 240, 270, 190)
      g.quadraticCurveTo(200, 230, 130, 190)
      g.quadraticCurveTo(100, 240, 75, 300)
      g.closePath()
      g.fill()
    }),
    eyes_open: layer((g) => {
      g.fillStyle = '#222'
      for (const x of [155, 245]) {
        g.beginPath()
        g.ellipse(x, 245, 11, 16, 0, 0, Math.PI * 2)
        g.fill()
      }
    }),
    eyes_closed: layer((g) => {
      g.strokeStyle = '#222'
      g.lineWidth = 5
      g.lineCap = 'round'
      for (const x of [155, 245]) {
        g.beginPath()
        g.arc(x, 243, 12, 0.15 * Math.PI, 0.85 * Math.PI)
        g.stroke()
      }
    }),
    mouth: layer((g) => {
      g.strokeStyle = '#c0504d'
      g.lineWidth = 5
      g.lineCap = 'round'
      g.beginPath()
      g.arc(200, 285, 16, 0.15 * Math.PI, 0.85 * Math.PI)
      g.stroke()
    }),
    hand_l: layer((g) => {
      g.fillStyle = '#ffe4d1'
      g.beginPath()
      g.arc(115, 430, 26, 0, Math.PI * 2)
      g.fill()
    }),
    hand_r: layer((g) => {
      g.fillStyle = '#ffe4d1'
      g.beginPath()
      g.arc(285, 430, 26, 0, Math.PI * 2)
      g.fill()
    }),
  }
  return cached
}
