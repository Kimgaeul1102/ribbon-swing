import { describe, expect, it } from 'vitest'
import { blinkTime, breathScale, knockDx, pickKnocker } from './motion'

describe('jar shelf motion', () => {
  it.each([2, 3, 4.5])('루프 %s초: 숨쉬기는 끝과 처음이 같고 1~1.02 범위', (loop) => {
    for (let i = 0; i < 6; i++) {
      expect(breathScale(loop, loop, i)).toBeCloseTo(breathScale(0, loop, i))
      for (let k = 0; k <= 30; k++) {
        const s = breathScale((k / 30) * loop, loop, i)
        expect(s).toBeGreaterThanOrEqual(1 - 1e-9)
        expect(s).toBeLessThanOrEqual(1.02 + 1e-9)
      }
    }
  })

  it('캐릭터마다 숨쉬는 타이밍이 다름', () => {
    expect(breathScale(0.5, 3, 0)).not.toBeCloseTo(breathScale(0.5, 3, 1))
  })

  it('깜빡임 시점은 루프 안에 들어옴', () => {
    for (let i = 0; i < 6; i++) {
      const bt = blinkTime(3, 0.9, i)
      expect(bt).toBeGreaterThanOrEqual(0)
      expect(bt).toBeLessThan(3)
    }
  })

  it('두드리는 사람은 seed로 고정, 범위 안', () => {
    expect(pickKnocker(5, 7)).toBe(pickKnocker(5, 7))
    expect(pickKnocker(5, 7)).toBeLessThan(5)
  })

  it('두드림은 구간 밖에서 0', () => {
    expect(knockDx(0, 3, 0.5)).toBe(0)
    expect(knockDx(1.5 + 0.1, 3, 0.5)).not.toBe(0)
  })
})
