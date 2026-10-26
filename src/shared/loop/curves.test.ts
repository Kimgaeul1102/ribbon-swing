import { describe, expect, it } from 'vitest'
import { bump, cyclesPerLoop, isBlinking, wrap, windowProgress } from './curves'

describe('curves', () => {
  it('wrap은 음수도 [0, loop)로', () => {
    expect(wrap(-0.5, 3)).toBeCloseTo(2.5)
    expect(wrap(3.2, 3)).toBeCloseTo(0.2)
  })

  it('구간이 루프 경계를 넘어도 이어짐', () => {
    expect(windowProgress(0.05, 3, 2.9, 0.4)).toBeCloseTo(0.375) // 시작 후 0.15초 / 0.4초
    expect(windowProgress(1, 3, 2.9, 0.4)).toBeNull()
  })

  it('bump는 구간 시작/끝에서 0, 가운데서 1', () => {
    expect(bump(1, 3, 1, 1)).toBeCloseTo(0)
    expect(bump(1.5, 3, 1, 1)).toBeCloseTo(1)
    expect(bump(2.5, 3, 1, 1)).toBe(0)
  })

  it('깜빡임은 루프당 한 번, 0.12초', () => {
    expect(isBlinking(1.0, 3, 1.0)).toBe(true)
    expect(isBlinking(1.2, 3, 1.0)).toBe(false)
  })

  it('cyclesPerLoop는 최소 1', () => {
    expect(cyclesPerLoop(3, 0.4)).toBe(8)
    expect(cyclesPerLoop(0.1, 0.4)).toBe(1)
  })
})
