import { describe, expect, it } from 'vitest'
import { layoutFor } from './frame'
import { findOpaqueBounds } from './trim'
import type { Layer } from '../store/useSwingStore'

const layer = (bbox: Layer['bbox'], canvas = { w: 100, h: 200 }): Layer => ({
  id: 'x',
  characterId: 'c',
  expression: 'always',
  assetId: 'a',
  name: 'n',
  src: '',
  zIndex: 0,
  pivot: { x: 0.5, y: 0 },
  delay: 0,
  speedMul: 1,
  amplitudeMul: 1,
  stiffness: 1,
  waveMul: 1,
  swayMul: 1,
  enabled: true,
  canvas,
  bbox,
})

describe('layoutFor', () => {
  it('여러 레이어의 내용 영역 합집합으로 자른다', () => {
    const f = layoutFor([layer({ x: 20, y: 40, w: 30, h: 60 }), layer({ x: 10, y: 60, w: 30, h: 100 })], true)
    // 합집합: x 10~50(40), y 40~160(120)
    expect(f.aspect).toBeCloseTo(40 / 120)
    expect(f.scale).toBeCloseTo(0.4)
    const r = f.rect(layer({ x: 0, y: 0, w: 1, h: 1 }))
    expect(r.left).toBeCloseTo(-25)
    expect(r.width).toBeCloseTo(250)
  })

  it('pivot(0.5, 0)은 잘린 영역의 위쪽 중앙', () => {
    const f = layoutFor([layer({ x: 20, y: 40, w: 40, h: 100 })], true)
    const p = f.localPivot(layer({ x: 20, y: 40, w: 40, h: 100 }))
    expect(p.x).toBeCloseTo(0.4) // (20 + 0.5*40) / 100
    expect(p.y).toBeCloseTo(0.2) // 40 / 200
  })

  it('자르기를 끄면 전체 캔버스', () => {
    const f = layoutFor([layer({ x: 20, y: 40, w: 40, h: 100 })], false)
    expect(f.aspect).toBeCloseTo(0.5)
    expect(f.scale).toBe(1)
  })

  it('캔버스 크기가 서로 다르면 자르지 않음', () => {
    const f = layoutFor([layer({ x: 0, y: 0, w: 5, h: 5 }), layer({ x: 0, y: 0, w: 5, h: 5 }, { w: 50, h: 50 })], true)
    expect(f.scale).toBe(1)
  })
})

describe('findOpaqueBounds', () => {
  it('불투명 픽셀 영역을 찾음', () => {
    const w = 4
    const h = 3
    const data = new Uint8ClampedArray(w * h * 4)
    data[(1 * w + 2) * 4 + 3] = 255
    data[(2 * w + 1) * 4 + 3] = 255
    expect(findOpaqueBounds(data, w, h)).toEqual({ x: 1, y: 1, w: 2, h: 2 })
  })

  it('전부 투명하면 null', () => {
    expect(findOpaqueBounds(new Uint8ClampedArray(16), 2, 2)).toBeNull()
  })
})
