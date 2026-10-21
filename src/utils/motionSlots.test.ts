import { describe, expect, it } from 'vitest'
import { MOTION_KEYS, createSlot, parseSlots, pickMotion, type MotionValues } from './motionSlots'

const values: MotionValues = {
  amplitude: 20, frequency: 0.8, damping: 0.2, wobble: 0.5, sway: 0.5,
  idleStrength: 6, ribbonSwing: 0.5, pushGap: 0.5, reactionSec: 1.2, popEffect: true,
}

describe('motionSlots', () => {
  it('움직임 값만 골라 저장한다', () => {
    const picked = pickMotion({ ...values, zoom: 1.2, bgColor: '#000' } as MotionValues)
    expect(Object.keys(picked).sort()).toEqual([...MOTION_KEYS].sort())
  })
  it('이름이 비면 기본 이름을 쓰고, 값은 복사본이다', () => {
    const slot = createSlot('  ', values)
    expect(slot.name).toBe('이름 없는 움직임')
    expect(slot.values).toEqual(values)
    expect(slot.values).not.toBe(values)
  })
  it('저장했다가 다시 읽으면 같다', () => {
    const slots = [createSlot('살랑', values), createSlot('쿵', { ...values, amplitude: 40 })]
    expect(parseSlots(JSON.stringify(slots))).toEqual(slots)
  })
  it('깨졌거나 값이 빠진 데이터는 걸러낸다', () => {
    expect(parseSlots(null)).toEqual([])
    expect(parseSlots('{망가짐')).toEqual([])
    expect(parseSlots('{"a":1}')).toEqual([])
    const broken = { id: 'x', name: 'n', values: { amplitude: 1 }, savedAt: 0 }
    expect(parseSlots(JSON.stringify([broken, createSlot('ok', values)])).map((s) => s.name)).toEqual(['ok'])
  })
})
