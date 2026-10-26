import { describe, expect, it } from 'vitest'
import { characterColumn } from './layout'

describe('characterColumn', () => {
  it('spacing 1이면 균등 분할', () => {
    expect(characterColumn(0, 2, 1)).toEqual({ center: 25, width: 50 })
    expect(characterColumn(1, 2, 1)).toEqual({ center: 75, width: 50 })
  })

  it('spacing을 줄이면 가운데로 모임', () => {
    expect(characterColumn(0, 2, 0.5).center).toBeCloseTo(37.5)
    expect(characterColumn(1, 2, 0.5).center).toBeCloseTo(62.5)
  })

  it('한 명이면 항상 가운데', () => {
    expect(characterColumn(0, 1, 0.3).center).toBeCloseTo(50)
  })
})
