import { describe, expect, it } from 'vitest'
import {
  pendulumAngle,
  pendulumVelocity,
  jellyStretch,
  stepSpring,
  swaySkew,
} from './pendulum'

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

describe('말랑한 움직임', () => {
  it('아래로 갈수록: 몸이 기운 반대 방향으로 기울여 아래가 더 쏠리고, sway 0이면 없음', () => {
    expect(swaySkew(20, 1)).toBeLessThan(0)
    expect(swaySkew(-20, 1)).toBeGreaterThan(0)
    expect(swaySkew(30, 0)).toBeCloseTo(0)
  })

  it('말랑함: 멈추면 0, 빠를수록 늘어나되 상한을 넘지 않음', () => {
    expect(jellyStretch(1, 0)).toBe(0)
    expect(jellyStretch(1, 50)).toBeLessThan(jellyStretch(1, 150))
    expect(jellyStretch(1, 100000)).toBeLessThanOrEqual(0.06)
    expect(jellyStretch(0, 300)).toBe(0)
    expect(jellyStretch(1, -150)).toBeCloseTo(jellyStretch(1, 150))
  })

  it('스프링은 목표에 수렴하고 중간에 한 번 넘어감(말랑)', () => {
    const s = { x: 0, v: 0 }
    let peak = 0
    for (let i = 0; i < 120; i++) {
      stepSpring(s, 10, 1 / 60)
      peak = Math.max(peak, s.x)
    }
    expect(peak).toBeGreaterThan(10)
    for (let i = 0; i < 600; i++) stepSpring(s, 10, 1 / 60)
    expect(s.x).toBeCloseTo(10, 1)
  })
})
