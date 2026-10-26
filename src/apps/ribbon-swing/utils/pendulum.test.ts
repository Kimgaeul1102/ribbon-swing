import { describe, expect, it } from 'vitest'
import {
  applyPush,
  pushDirection,
  idleAngle,
  oscillator,
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

describe('idleAngle(계속 흔들기)', () => {
  it('세기 0이면 가만히, 아무리 시간이 지나도 ±세기를 넘지 않음', () => {
    expect(idleAngle(3.3, 0, 0.8, 0.4)).toBe(0)
    for (let t = 0; t < 120; t += 0.1) {
      expect(Math.abs(idleAngle(t, 8, 0.8, 0.3))).toBeLessThanOrEqual(8)
    }
  })

  it('seed가 다르면 다르게 흔들리고, 같으면 같음', () => {
    expect(idleAngle(2, 8, 0.8, 0.1)).not.toBeCloseTo(idleAngle(2, 8, 0.8, 0.6))
    expect(idleAngle(2, 8, 0.8, 0.1)).toBe(idleAngle(2, 8, 0.8, 0.1))
  })

  it('실제로 좌우로 오감', () => {
    const values = Array.from({ length: 200 }, (_, i) => idleAngle(i * 0.05, 8, 0.8, 0.2))
    expect(Math.max(...values)).toBeGreaterThan(4)
    expect(Math.min(...values)).toBeLessThan(-4)
  })
})

describe('밀기 진동 (충격을 더하는 방식)', () => {
  it('정지 상태에서 한 번 밀면 예전 감쇠 진자(pendulumAngle)와 같은 궤적', () => {
    const { w, omega, zeta } = oscillator(0.8, 0.2, 1)
    const s = { x: 0, v: 0 }
    applyPush(s, 20, w)
    for (let i = 0; i < 60; i++) stepSpring(s, 0, 1 / 60, omega, zeta)
    expect(s.x).toBeCloseTo(pendulumAngle(1, 20, 0.8, 0.2), 0)
  })

  it('흔들리는 중에 또 밀면 0으로 돌아가지 않고 지금 속도에 더해짐', () => {
    const { w, omega, zeta } = oscillator(0.8, 0.2, 1)
    const s = { x: 0, v: 0 }
    applyPush(s, 20, w)
    for (let i = 0; i < 20; i++) stepSpring(s, 0, 1 / 60, omega, zeta)
    const before = { ...s }
    applyPush(s, 20, w)
    expect(s.x).toBe(before.x) // 각도는 그대로 (초반으로 돌아가지 않음)
    expect(Math.abs(s.v)).toBeGreaterThan(Math.abs(before.v)) // 속도만 커짐
  })

  it('여러 번 눌러도 속도에 상한이 있음', () => {
    const { w } = oscillator(0.8, 0.2, 1)
    const s = { x: 0, v: 0 }
    for (let i = 0; i < 50; i++) applyPush(s, 30, w)
    expect(Math.abs(s.v)).toBeLessThanOrEqual(70 * w + 1e-9)
  })

  it('속도 배율이 낮으면 천천히 진동', () => {
    expect(oscillator(0.8, 0.2, 0.5).w).toBeCloseTo(oscillator(0.8, 0.2, 1).w / 2)
  })
})

describe('밀기 방향', () => {
  it('방향을 정해 주면 레이어의 현재 속도와 상관없이 그 방향으로 밀림 (몸과 반대로 움직이는 것 방지)', () => {
    const { w } = oscillator(0.8, 0.2, 1)
    const hair = { x: 0, v: -30 } // 지연된 레이어가 반대 방향으로 움직이는 중
    applyPush(hair, 20, w, 1)
    expect(hair.v).toBeGreaterThan(0)
    const own = { x: 0, v: -30 }
    applyPush(own, 20, w) // 방향을 안 주면 예전처럼 자기 방향
    expect(own.v).toBeLessThan(-30)
  })

  it('멈춰 있으면 오른쪽', () => {
    expect(pushDirection({ v: 0 })).toBe(1)
    expect(pushDirection({ v: -1 })).toBe(-1)
  })
})
