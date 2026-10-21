import { describe, expect, it } from 'vitest'
import { EXPORT_LEAD_MS, buildExportInput, planDuration } from './plan'

const base = {
  amplitude: 20,
  frequency: 0.8,
  damping: 0.6,
  wobble: 0,
  sway: 0,
  reactionSec: 1.2,
  ribbonSwing: 0.5,
  idleStrength: 0,
  pushGap: 0.3,
  characters: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
  layers: ['a', 'b', 'c'].map((id) => ({
    id: `L${id}`,
    characterId: id,
    delay: 0,
    speedMul: 1,
    amplitudeMul: 1,
    stiffness: 1,
    waveMul: 0,
    swayMul: 0,
    expression: 'always' as const,
  })),
}

describe('buildExportInput', () => {
  it('한번에: 모두 같은 시각에 밀림. 계속 흔들기는 빠짐', () => {
    const input = buildExportInput({ ...base }, 'all')
    expect(input.idleOn).toBe(false)
    expect(input.characters.map((c) => c.swingStartedAt)).toEqual([EXPORT_LEAD_MS, EXPORT_LEAD_MS, EXPORT_LEAD_MS])
  })

  it('차례대로: 인원마다 pushGap초씩 늦게', () => {
    const input = buildExportInput({ ...base }, 'sequential')
    expect(input.characters.map((c) => c.swingStartedAt)).toEqual([150, 450, 750])
    expect(input.characters.map((c) => c.reactedAt)).toEqual([150, 450, 750])
  })
})

describe('planDuration (한 번 흔들림이 끝나는 기준)', () => {
  it('가라앉으면 거기서 끝남 (최대 길이보다 짧음)', () => {
    const plan = planDuration(buildExportInput({ ...base }, 'all'), 30, 20)
    expect(plan.capped).toBe(false)
    expect(plan.seconds).toBeGreaterThan(1)
    expect(plan.seconds).toBeLessThan(20)
  })

  it('감쇠가 클수록 빨리 끝남', () => {
    const slow = planDuration(buildExportInput({ ...base, damping: 0.4 }, 'all'), 30, 30).seconds
    const fast = planDuration(buildExportInput({ ...base, damping: 1 }, 'all'), 30, 30).seconds
    expect(fast).toBeLessThan(slow)
  })

  it('차례대로 밀면 마지막 인원까지 끝나야 해서 더 길다', () => {
    const all = planDuration(buildExportInput({ ...base }, 'all'), 30, 30).seconds
    const seq = planDuration(buildExportInput({ ...base }, 'sequential'), 30, 30).seconds
    expect(seq).toBeGreaterThan(all)
  })

  it('감쇠가 0이면 끝나지 않아서 최대 길이에서 자름', () => {
    const plan = planDuration(buildExportInput({ ...base, damping: 0 }, 'all'), 30, 5)
    expect(plan.capped).toBe(true)
    expect(plan.seconds).toBe(5)
  })

  it('fps가 달라도 끝나는 시각은 거의 같음', () => {
    const a = planDuration(buildExportInput({ ...base }, 'all'), 15, 30).seconds
    const b = planDuration(buildExportInput({ ...base }, 'all'), 60, 30).seconds
    expect(Math.abs(a - b)).toBeLessThan(0.3)
  })
})
