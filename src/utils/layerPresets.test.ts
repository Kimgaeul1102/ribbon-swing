import { describe, expect, it } from 'vitest'
import { guessExpression, guessPreset } from './layerPresets'

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
