import { describe, expect, it } from 'vitest'
import { detectPart } from './useCharacterStore'

describe('detectPart', () => {
  it('파일 이름으로 파츠를 찾음', () => {
    expect(detectPart('body.png')).toBe('body')
    expect(detectPart('Eyes_Open.PNG')).toBe('eyes_open')
    expect(detectPart('eyes-closed.png')).toBe('eyes_closed')
    expect(detectPart('hand l.png')).toBe('hand_l')
  })

  it('모르는 이름은 null', () => {
    expect(detectPart('face.png')).toBeNull()
  })
})
