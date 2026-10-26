import { describe, expect, it } from 'vitest'
import { layoutJars } from './layout'

describe('layoutJars', () => {
  it.each([1, 2, 3, 4, 5, 6])('%s명이면 병 %s개가 장면 안에 들어옴', (n) => {
    const slots = layoutJars(n, 2)
    expect(slots).toHaveLength(n)
    for (const s of slots) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(0)
      expect(s.x + s.w / 2).toBeLessThanOrEqual(600)
    }
  })

  it('1단이면 판자가 하나', () => {
    expect(new Set(layoutJars(4, 1).map((s) => s.boardY)).size).toBe(1)
  })

  it('1명이어도 2단 설정이 깨지지 않음', () => {
    expect(layoutJars(1, 2)).toHaveLength(1)
  })
})
