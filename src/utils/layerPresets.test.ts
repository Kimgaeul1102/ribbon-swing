import { describe, expect, it } from 'vitest'
import { createLayer, guessExpression, guessPreset } from './layerPresets'

describe('guessPreset', () => {
  it('이름에 hair/머리가 있으면 늦게 따라오는 프리셋', () => {
    expect(guessPreset('hair_front').delay).toBe(80)
    expect(guessPreset('뒷머리').stiffness).toBeCloseTo(0.15)
  })

  it('tie/넥타이', () => {
    expect(guessPreset('Tie').amplitudeMul).toBe(1.8)
    expect(guessPreset('넥타이').delay).toBe(120)
  })

  it('모르는 이름은 본체처럼 딱 붙음', () => {
    const p = guessPreset('white_shirt')
    expect(p.delay).toBe(0)
    expect(p.stiffness).toBe(1)
  })
})

describe('guessExpression', () => {
  it('이름으로 표시 조건 추측', () => {
    expect(guessExpression('face_hit')).toBe('hit')
    expect(guessExpression('놀란얼굴')).toBe('hit')
    expect(guessExpression('face_normal')).toBe('normal')
    expect(guessExpression('hair')).toBe('always')
  })
})

describe('createLayer', () => {
  const asset = { id: 'a', name: 'hair', url: '', canvas: { w: 10, h: 10 }, bbox: { x: 0, y: 0, w: 10, h: 10 } }

  it('회전 기준점 높이는 인원의 끈이 달린 높이를 따름', () => {
    expect(createLayer(asset, 0, 'c').pivot).toEqual({ x: 0.5, y: 0 })
    expect(createLayer(asset, 0, 'c', 0.35).pivot).toEqual({ x: 0.5, y: 0.35 })
  })

  it('프리셋(지연/강성)은 그대로', () => {
    expect(createLayer(asset, 0, 'c', 0.35).delay).toBe(80)
  })
})
