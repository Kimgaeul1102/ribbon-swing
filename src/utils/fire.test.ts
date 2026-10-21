import { describe, expect, it } from 'vitest'
import { cookFilter, cookStep } from './fire'

describe('cookStep', () => {
  it('불이 꺼져 있으면 익은 정도가 그대로다', () => {
    expect(cookStep(0.4, false, 1)).toBe(0.4)
  })
  it('불이 켜져 있으면 1에 가까워지되 넘지 않는다', () => {
    let l = 0
    for (let i = 0; i < 600; i++) l = cookStep(l, true, 0.1)
    expect(l).toBeGreaterThan(0.95)
    expect(l).toBeLessThanOrEqual(1)
  })
  it('처음에는 빨리, 갈수록 천천히 익는다', () => {
    const a = cookStep(0, true, 1)
    const b = cookStep(a, true, 1) - a
    expect(a).toBeGreaterThan(b)
  })
})

describe('cookFilter', () => {
  it('안 익었으면 필터 없음', () => {
    expect(cookFilter(0)).toBe('none')
  })
  it('익을수록 어두워진다', () => {
    const bright = (s: string) => Number(/brightness\(([\d.]+)\)/.exec(s)![1])
    expect(bright(cookFilter(1))).toBeLessThan(bright(cookFilter(0.3)))
  })
})
