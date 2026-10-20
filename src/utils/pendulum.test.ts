import { describe, expect, it } from 'vitest'
import { pendulumAngle, pendulumVelocity, swayShift, swayStiffness } from './pendulum'

describe('pendulumAngle', () => {
  it('t=0이면 0도', () => {
    expect(pendulumAngle(0, 20, 1, 0.3)).toBeCloseTo(0)
  })

  it('감쇠 0이면 1/4 주기에서 최대 진폭', () => {
    expect(pendulumAngle(0.25, 20, 1, 0)).toBeCloseTo(20)
  })

  it('감쇠가 클수록 시간이 지나면 작아짐', () => {
    const a = Math.abs(pendulumAngle(2.25, 20, 1, 0.1))
    const b = Math.abs(pendulumAngle(2.25, 20, 1, 1))
    expect(b).toBeLessThan(a)
  })
})

describe('pendulumVelocity', () => {
  it('수치 미분과 일치', () => {
    const t = 0.37
    const h = 1e-5
    const numeric = (pendulumAngle(t + h, 20, 0.8, 0.2) - pendulumAngle(t - h, 20, 0.8, 0.2)) / (2 * h)
    expect(pendulumVelocity(t, 20, 0.8, 0.2)).toBeCloseTo(numeric, 3)
  })
})

describe('sway', () => {
  it('pivot(depth 0)은 안 움직이고 아래로 갈수록 더 많이 움직임', () => {
    expect(swayShift(20, 0, 1)).toBeCloseTo(0)
    expect(Math.abs(swayShift(20, 1, 1))).toBeGreaterThan(Math.abs(swayShift(20, 0.5, 1)))
  })

  it('sway 0이면 효과 없음', () => {
    expect(swayShift(30, 1, 0)).toBeCloseTo(0)
  })

  it('아래쪽일수록 스프링이 느슨함', () => {
    expect(swayStiffness(1)).toBeLessThan(swayStiffness(0))
  })
})
