import { describe, expect, it } from 'vitest'
import { DEFAULT_ROPE, edgesAt, planRope, silhouetteEdges, smoothEdges, turnPoints } from './rope'

/** w×h 투명 이미지에 줄마다 [왼쪽, 오른쪽) 구간만 불투명하게 */
function body(w: number, h: number, span: (y: number) => [number, number] | null): Uint8ClampedArray {
  const d = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    const s = span(y)
    if (!s) continue
    for (let x = s[0]; x < s[1]; x++) d[(y * w + x) * 4 + 3] = 255
  }
  return d
}

describe('silhouetteEdges', () => {
  it('줄마다 몸의 양 끝을 구하고 빈 줄은 -1', () => {
    const e = silhouetteEdges(body(20, 4, (y) => (y === 2 ? null : [5 + y, 15])), 20, 4)
    expect(e.left).toEqual([5, 6, -1, 8])
    expect(e.right).toEqual([15, 15, -1, 15])
  })
})

describe('smoothEdges', () => {
  it('튀는 값을 평균으로 누그러뜨리고 빈 줄은 그대로 둔다', () => {
    const s = smoothEdges({ left: [10, 30, 10, -1], right: [50, 50, 50, -1] }, 1)
    expect(s.left[1]).toBeCloseTo(50 / 3, 5)
    expect(s.left[3]).toBe(-1)
  })
})

describe('edgesAt', () => {
  const e = { left: [-1, -1, 10, -1, -1], right: [-1, -1, 30, -1, -1] }
  it('그 줄에 몸이 없으면 가까운 줄에서 찾는다', () => {
    expect(edgesAt(e, 3, 2)).toEqual({ left: 10, right: 30 })
  })
  it('범위 안에 몸이 없으면 null', () => {
    expect(edgesAt(e, 0, 1)).toBeNull()
  })
})

describe('planRope', () => {
  const edges = silhouetteEdges(body(100, 200, () => [30, 70]), 100, 200)
  const bbox = { x: 30, y: 0, w: 40, h: 200 }
  it('바퀴 수만큼, 위에서 아래로 일정 간격으로 계획한다', () => {
    const plan = planRope(edges, bbox, { ...DEFAULT_ROPE, top: 0.2, bottom: 0.6, turns: 4 })!
    expect(plan.turns).toHaveLength(4)
    const ys = plan.turns.map((t) => t.yc)
    expect([...ys].sort((a, b) => a - b)).toEqual(ys)
    expect(ys[1] - ys[0]).toBeCloseTo(plan.pitch, 5)
    expect(plan.turns[0]).toMatchObject({ left: 30, right: 70 })
  })
  it('굵기는 바퀴 간격보다 두꺼워지지 않는다', () => {
    const plan = planRope(edges, bbox, { ...DEFAULT_ROPE, turns: 10, thickness: 0.1 })!
    expect(plan.t).toBeLessThanOrEqual(plan.pitch * 1.15 + 1e-9)
  })
  it('몸이 없으면 null', () => {
    const empty = silhouetteEdges(body(10, 10, () => null), 10, 10)
    expect(planRope(empty, { x: 0, y: 0, w: 10, h: 10 }, DEFAULT_ROPE)).toBeNull()
  })
})

describe('turnPoints', () => {
  const turn = { yc: 100, left: 30, right: 70 }
  it('몸보다 굵기만큼 바깥까지 나가고, 가운데가 양 끝보다 처진다', () => {
    const pts = turnPoints(turn, 6, 20, 1)
    expect(pts[0].x).toBeLessThan(30)
    expect(pts[pts.length - 1].x).toBeGreaterThan(70)
    const mid = pts[Math.floor(pts.length / 2)]
    const edgeAvg = (pts[0].y + pts[pts.length - 1].y) / 2
    expect(mid.y).toBeGreaterThan(edgeAvg)
  })
  it('처짐이 0이면 직선에 가깝다', () => {
    const pts = turnPoints(turn, 6, 0, 0)
    expect(new Set(pts.map((p) => p.y)).size).toBe(1)
  })
})
