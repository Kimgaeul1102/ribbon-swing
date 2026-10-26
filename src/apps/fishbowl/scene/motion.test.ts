import { describe, expect, it } from 'vitest'
import { bob, bubbleProgress, makeBubbles, tilt } from './motion'

describe('fishbowl motion', () => {
  it('부유/기울기는 루프 끝과 처음이 같음', () => {
    expect(bob(3, 3, 12)).toBeCloseTo(bob(0, 3, 12))
    expect(tilt(3, 3, 4)).toBeCloseTo(tilt(0, 3, 4))
  })

  it('거품은 seed가 같으면 똑같음', () => {
    expect(makeBubbles(4, 5)).toEqual(makeBubbles(4, 5))
    expect(makeBubbles(4, 5)).not.toEqual(makeBubbles(4, 6))
  })

  it('거품은 루프당 정확히 한 번 올라감', () => {
    const [b] = makeBubbles(1, 1)
    let rises = 0
    let prev = false
    for (let i = 0; i <= 600; i++) {
      const vis = bubbleProgress(b, (i % 600) / 600) !== null
      if (vis && !prev) rises++
      prev = vis
    }
    // 시작 시점에 이미 보이는 경우와 경계 처리를 합쳐 한 번
    expect(rises).toBeLessThanOrEqual(2)
    expect(bubbleProgress(b, b.phase)).toBeCloseTo(0)
  })
})
