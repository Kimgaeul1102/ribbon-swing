import { describe, expect, it } from 'vitest'
import { seedFromId } from './id'

describe('seedFromId', () => {
  it('0 이상 1 미만이고 같은 id면 같은 값', () => {
    for (const id of ['a', 'abc123', 'm1x2y3z4']) {
      const v = seedFromId(id)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
      expect(seedFromId(id)).toBe(v)
    }
  })

  it('id가 다르면 값이 다름', () => {
    expect(seedFromId('char-a')).not.toBe(seedFromId('char-b'))
  })
})
