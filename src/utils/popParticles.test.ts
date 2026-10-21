import { describe, expect, it } from 'vitest'
import { POP_DURATION_MS, easeOut, popPose } from './popParticles'

describe('easeOut (CSS ease-out)', () => {
  it('0에서 0, 1에서 1, 중간은 빠르게 시작(앞쪽이 더 많이 감)', () => {
    expect(easeOut(0)).toBe(0)
    expect(easeOut(1)).toBe(1)
    expect(easeOut(0.5)).toBeGreaterThan(0.5)
  })

  it('항상 증가', () => {
    let prev = -1
    for (let p = 0; p <= 1; p += 0.05) {
      const v = easeOut(p)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })
})

describe('popPose (뿅뿅 조각의 움직임)', () => {
  const p = { dx: 90, dy: 0 }

  it('시작 전과 끝난 뒤에는 안 보임', () => {
    expect(popPose(-1, p).opacity).toBe(0)
    expect(popPose(POP_DURATION_MS, p).opacity).toBe(0)
  })

  it('25% 지점에서 가장 크고(1.4배) 가장 진함', () => {
    const peak = popPose(POP_DURATION_MS * 0.25, p)
    expect(peak.scale).toBeCloseTo(1.4, 1)
    expect(peak.opacity).toBeCloseTo(1, 1)
    expect(peak.x).toBeCloseTo(90 * 0.6, 0)
  })

  it('끝으로 갈수록 멀리 퍼지고 흐려짐', () => {
    const mid = popPose(POP_DURATION_MS * 0.6, p)
    const late = popPose(POP_DURATION_MS * 0.95, p)
    expect(late.x).toBeGreaterThan(mid.x)
    expect(late.opacity).toBeLessThan(mid.opacity)
  })
})
