import { describe, expect, it } from 'vitest'
import { carShake, headTurn, lightCycles, lightPhase, sighScale } from './motion'

describe('police car motion', () => {
  it.each([2, 3, 4.5])('루프 %s초: 경광등/진동은 끝과 처음이 같음', (loop) => {
    expect(lightPhase(loop - 1e-9, loop, 1)).toBeGreaterThan(0.99)
    expect(lightPhase(0, loop, 1)).toBe(0)
    expect(carShake(loop, loop)).toBeCloseTo(carShake(0, loop))
  })

  it('경광등 바퀴 수는 정수이고 속도가 빠르면 늘어남', () => {
    expect(Number.isInteger(lightCycles(3, 1))).toBe(true)
    expect(lightCycles(3, 2)).toBeGreaterThan(lightCycles(3, 1))
  })

  it('고개 돌리기: 구간 밖 0, 가운데 -6°', () => {
    expect(headTurn(0, 3, 0.5)).toBe(0)
    expect(headTurn(1.5 + 0.3, 3, 0.5)).toBeCloseTo(-6)
  })

  it('한숨은 1에서 시작해서 1로 끝남', () => {
    expect(sighScale(0, 3, 0.5)).toBe(1)
    expect(sighScale(1.5, 3, 0.5)).toBeCloseTo(1)
    expect(sighScale(1.5 + 0.9 * 0.2, 3, 0.5)).toBeGreaterThan(1)
    expect(sighScale(1.5 + 0.9 * 0.7, 3, 0.5)).toBeLessThan(1)
  })
})
