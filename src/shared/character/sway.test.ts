import { describe, expect, it } from 'vitest'
import { combineMotion, swayMotion, type Drive } from './sway'

const S = { strength: 1.5, lag: 0.15, speed: 1, pivotX: 0.5, pivotY: 0.1 }
const rotOf = (strength: number, t: number, loop = 3) => swayMotion({ ...S, strength }, { t, loop }).rot ?? 0

describe('swayMotion', () => {
  it.each([2, 3, 4.5])('루프 %s초: 평소 살랑거림은 끝과 처음이 이어짐', (loop) => {
    expect(rotOf(1.5, loop, loop)).toBeCloseTo(rotOf(1.5, 0, loop))
  })

  it('강도 0이면 안 흔들리고, 강도가 클수록 더 크게 흔들림', () => {
    const peak = (strength: number) => {
      let m = 0
      for (let i = 0; i < 200; i++) m = Math.max(m, Math.abs(rotOf(strength, (i / 200) * 3)))
      return m
    }
    expect(peak(0)).toBe(0)
    expect(peak(3)).toBeGreaterThan(peak(1) * 2.5)
  })

  it('몸 움직임을 늦게 따라감: 몸이 빨라지는 순간 반대쪽으로 처짐', () => {
    // 몸이 시간에 비례해 오른쪽으로 기울어지는 중이면 lag초 전 값이 더 작으므로 (과거-현재) < 0
    const drive = (t: number): Drive => ({ rot: 10 * t, dx: 0, dy: 0 })
    const m = swayMotion({ ...S, strength: 2, lag: 0.2 }, { t: 1, loop: 100, drive })
    // 평소 살랑거림을 빼고 따라가기 몫만 확인하려고 속도를 매우 느리게 한 같은 조건과 비교
    const base = swayMotion({ ...S, strength: 2, lag: 0.2 }, { t: 1, loop: 100 })
    expect((m.rot ?? 0) - (base.rot ?? 0)).toBeCloseTo(2 * (10 * 0.8 - 10 * 1))
  })

  it('앱이 준 기본 움직임을 유지하고 기준점은 레이어 설정을 씀', () => {
    const m = swayMotion(S, { t: 0, loop: 3, base: { dx: 4 } })
    expect(m.dx).toBe(4)
    expect(m.px).toBe(0.5)
    expect(m.py).toBe(0.1)
  })
})

describe('combineMotion', () => {
  it('이동/회전은 합, 확대는 곱', () => {
    const r = combineMotion({ dx: 1, rot: 2, sy: 1.1 }, { dx: 3, rot: 4, sy: 2, px: 0.3 })
    expect(r).toMatchObject({ dx: 4, rot: 6, px: 0.3 })
    expect(r.sy).toBeCloseTo(2.2)
  })
})
