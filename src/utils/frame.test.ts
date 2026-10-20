import { describe, expect, it } from 'vitest'
import { layoutFor } from './frame'
import { computeCrop, moveGroupInLayers, orderedGroups } from './groups'
import { findOpaqueBounds } from './trim'
import type { Layer, LayerGroup } from '../store/useSwingStore'

const layer = (bbox: Layer['bbox'], groupId = 'g1', canvas = { w: 100, h: 200 }, zIndex = 0, id = 'x'): Layer => ({
  id,
  characterId: 'c',
  groupId,
  expression: 'always',
  assetId: 'a',
  name: 'n',
  src: '',
  zIndex,
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

/** 레이어들로 폴더를 만든다 (업로드 때와 같이 crop을 한 번 계산해서 고정) */
const group = (id: string, members: Layer[], createdAt: number): LayerGroup => ({
  id,
  characterId: 'c',
  name: id,
  createdAt,
  collapsed: false,
  ...computeCrop(members),
})

describe('computeCrop', () => {
  it('폴더 안 레이어들의 내용 영역 합집합', () => {
    const { crop } = computeCrop([layer({ x: 20, y: 40, w: 30, h: 60 }), layer({ x: 10, y: 60, w: 30, h: 100 })])
    expect(crop).toEqual({ x: 10, y: 40, w: 40, h: 120 })
  })

  it('캔버스 크기가 서로 다르면 자르지 않음', () => {
    const { canvas, crop } = computeCrop([layer({ x: 0, y: 0, w: 5, h: 5 }), layer({ x: 0, y: 0, w: 5, h: 5 }, 'g1', { w: 50, h: 50 })])
    expect(canvas).toBeNull()
    expect(crop).toBeNull()
  })
})

describe('layoutFor', () => {
  it('기준 폴더의 자른 영역으로 프레임을 정하고, 폴더 안 레이어는 원본 위치 그대로', () => {
    const a = layer({ x: 20, y: 40, w: 30, h: 60 })
    const b = layer({ x: 10, y: 60, w: 30, h: 100 })
    const f = layoutFor([group('g1', [a, b], 1)], [a, b], true)
    // 합집합: x 10~50(40), y 40~160(120)
    expect(f.aspect).toBeCloseTo(40 / 120)
    const r = f.rect(a)
    expect(r.left).toBeCloseTo(-25)
    expect(r.width).toBeCloseTo(250)
  })

  it('pivot(0.5, 0)은 잘린 영역의 위쪽 중앙, y를 키우면 아래로', () => {
    const l = layer({ x: 20, y: 40, w: 40, h: 100 })
    const f = layoutFor([group('g1', [l], 1)], [l], true)
    const p = f.localPivot(l)
    expect(p.x).toBeCloseTo(0.4) // (20 + 0.5*40) / 100
    expect(p.y).toBeCloseTo(0.2) // 40 / 200
    const low = f.localPivot({ ...l, pivot: { x: 0.5, y: 0.5 } })
    expect(low.y).toBeCloseTo((40 + 50) / 200)
  })

  it('다른 폴더를 더해도 먼저 올린 폴더의 프레임/위치/크기는 그대로 (고정)', () => {
    const a = layer({ x: 20, y: 40, w: 40, h: 100 })
    const before = layoutFor([group('g1', [a], 1)], [a], true)
    const bigger = layer({ x: 0, y: 0, w: 100, h: 200 }, 'g2')
    const g1 = group('g1', [a], 1)
    const after = layoutFor([g1, group('g2', [bigger], 2)], [a, bigger], true)
    expect(after.aspect).toBe(before.aspect)
    expect(after.rect(a)).toEqual(before.rect(a))
    expect(after.localPivot(a)).toEqual(before.localPivot(a))
  })

  it('같은 캔버스 크기의 다른 폴더는 원본 위치 그대로 겹침', () => {
    const a = layer({ x: 20, y: 40, w: 40, h: 100 })
    const b = layer({ x: 30, y: 60, w: 10, h: 20 }, 'g2')
    const f = layoutFor([group('g1', [a], 1), group('g2', [b], 2)], [a, b], true)
    expect(f.rect(b)).toEqual(f.rect(a)) // 같은 캔버스라 같은 위치·크기로 깔림
  })

  it('크기가 다른 폴더는 자기 영역을 프레임 높이에 맞춰 가운데 정렬', () => {
    const a = layer({ x: 0, y: 0, w: 100, h: 200 })
    const other = layer({ x: 10, y: 10, w: 40, h: 80 }, 'g2', { w: 50, h: 100 })
    const f = layoutFor([group('g1', [a], 1), group('g2', [other], 2)], [a, other], true)
    // 프레임: 100x200(aspect .5). 다른 폴더 bbox 높이 80 → 프레임 높이에 맞춤(k=1/80)
    const r = f.rect(other)
    expect(r.height).toBeCloseTo((100 / 80) * 100)
    expect(r.top).toBeCloseTo((-10 / 80) * 100)
  })

  it('자르기를 끄면 기준 폴더의 전체 캔버스', () => {
    const l = layer({ x: 20, y: 40, w: 40, h: 100 })
    const f = layoutFor([group('g1', [l], 1)], [l], false)
    expect(f.aspect).toBeCloseTo(0.5)
    const r = f.rect(l)
    expect([r.left, r.top, r.width, r.height].map((v) => Math.abs(v))).toEqual([0, 0, 100, 100])
  })
})

describe('폴더 순서', () => {
  const a1 = layer({ x: 0, y: 0, w: 1, h: 1 }, 'g1', undefined, 0, 'a1')
  const a2 = layer({ x: 0, y: 0, w: 1, h: 1 }, 'g1', undefined, 1, 'a2')
  const b1 = layer({ x: 0, y: 0, w: 1, h: 1 }, 'g2', undefined, 2, 'b1')
  const groups = [group('g1', [a1, a2], 1), group('g2', [b1], 2)]
  const layers = [a1, a2, b1]

  it('zIndex가 낮은 폴더가 먼저(뒤)', () => {
    expect(orderedGroups(groups, layers).map((g) => g.id)).toEqual(['g1', 'g2'])
  })

  it('폴더를 앞으로 옮기면 폴더 단위로 순서가 바뀌고 안의 순서는 유지', () => {
    const moved = moveGroupInLayers(layers, groups, 'g1', 'up')
    const z = Object.fromEntries(moved.map((l) => [l.id, l.zIndex]))
    expect(z.b1).toBe(0) // g2가 뒤로
    expect(z.a1).toBe(1)
    expect(z.a2).toBe(2) // g1 안에서 a1 < a2 유지
  })

  it('맨 앞 폴더를 더 앞으로 옮기려 하면 그대로', () => {
    expect(moveGroupInLayers(layers, groups, 'g2', 'up')).toBe(layers)
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
