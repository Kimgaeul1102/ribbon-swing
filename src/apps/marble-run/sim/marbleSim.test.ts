import { describe, expect, it } from 'vitest'
import { PRESETS } from '../track/presets'
import type { Character, SimConfig } from '../types'
import { createSim, ranking, stepSim } from './marbleSim'
import { makeRng } from './rng'

const chars: Character[] = ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id, color: '#f00' }))
const base = (preset: keyof typeof PRESETS, seed: number): SimConfig => ({
  preset: PRESETS[preset],
  characters: chars,
  marble: { radius: 14, restitution: 0.4, friction: 0.01, frictionAir: 0.002, density: 0.002, rotateSprite: true },
  seed,
  gravity: 1,
  timeoutSec: 30,
})

function run(config: SimConfig) {
  const sim = createSim(config)
  for (let i = 0; i < 60 * 40 && !sim.done; i++) stepSim(sim)
  return sim
}

describe('rng', () => {
  it('같은 seed면 같은 값', () => {
    const a = makeRng(7)
    const b = makeRng(7)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
})

describe('marbleSim', () => {
  it('같은 seed면 같은 순위, 다른 seed면 시작 위치가 다름', () => {
    const r1 = ranking(run(base('zigzag', 1))).map((m) => m.id)
    const r2 = ranking(run(base('zigzag', 1))).map((m) => m.id)
    expect(r1).toEqual(r2)
    const s1 = createSim(base('zigzag', 1)).marbles[0].body.position.x
    const s2 = createSim(base('zigzag', 2)).marbles[0].body.position.x
    expect(s1).not.toBe(s2)
  })

  it.each(['solo', 'zigzag', 'pinball', 'gauntlet'] as const)('%s 프리셋에서 구슬이 골인함', (id) => {
    const sim = run(base(id, 3))
    expect(sim.order.length).toBeGreaterThan(0)
    expect(sim.done).toBe(true)
  })
})
