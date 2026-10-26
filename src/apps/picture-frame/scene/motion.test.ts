import { describe, expect, it } from 'vitest'
import { frameSway, isKnocking, ripples, tapPulse, tapTimes } from './motion'

const KNOCKS = [0.6, 1.8]

describe('picture frame motion', () => {
  it('한 번 두드리면 톡 2번', () => {
    expect(tapTimes([0.6, 1.8], 3)).toHaveLength(4)
  })

  it.each([1.5, 3, 4])('루프 %s초: 흔들림은 끝과 처음이 이어짐', (loop) => {
    const a = frameSway(loop - 1e-6, loop, KNOCKS)
    const b = frameSway(0, loop, KNOCKS)
    expect(a).toBeCloseTo(b, 2)
  })

  it('두드리기 전엔 0, 두드린 뒤엔 흔들리고 2초 뒤엔 거의 멈춤', () => {
    expect(frameSway(0.3, 8, [0.6])).toBe(0)
    expect(Math.abs(frameSway(0.75, 8, [0.6]))).toBeGreaterThan(0)
    expect(Math.abs(frameSway(0.6 + 0.18 + 2.5, 8, [0.6]))).toBeLessThan(0.05)
  })

  it('흔들림은 ±1.5° 안팎', () => {
    let max = 0
    for (let i = 0; i < 300; i++) max = Math.max(max, Math.abs(frameSway((i / 300) * 3, 3, KNOCKS)))
    expect(max).toBeLessThan(2.2)
  })

  it('파문은 톡 직후에만 있음', () => {
    expect(ripples(0.3, 8, [0.6])).toHaveLength(0)
    expect(ripples(0.7, 8, [0.6]).length).toBeGreaterThan(0)
  })

  it('톡 순간에만 펄스, 눈은 두드릴 때만 감김', () => {
    expect(tapPulse(0.3, 8, [0.6])).toBe(0)
    expect(tapPulse(0.66, 8, [0.6])).toBeGreaterThan(0.9)
    expect(isKnocking(0.3, 8, [0.6])).toBe(false)
    expect(isKnocking(0.7, 8, [0.6])).toBe(true)
  })
})
