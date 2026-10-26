import { describe, expect, it } from 'vitest'
import { createSimulation, type SimInput } from './swingSim'

const layer = (id: string, delay = 0, stiffness = 1, speedMul = 1) => ({
  id,
  characterId: 'c',
  delay,
  speedMul,
  amplitudeMul: 1,
  stiffness,
  waveMul: 0,
  swayMul: 0,
  expression: 'always' as const,
})

const input = (over: Partial<SimInput> = {}): SimInput => ({
  amplitude: 20,
  frequency: 0.8,
  damping: 0.5,
  wobble: 0,
  sway: 0,
  reactionSec: 1.2,
  idleOn: false,
  idleStrength: 0,
  ribbonSwing: 0.5,
  stopAt: 0,
  characters: [{ id: 'c', swingStartedAt: 100, reactedAt: 100 }],
  layers: [layer('body'), layer('hair', 80, 0.15)],
  ...over,
})

/** 가상 시간으로 sec초 진행하며 매 프레임 결과를 모음 */
function run(sec: number, inp: SimInput, fps = 60) {
  const sim = createSimulation()
  const dt = 1 / fps
  const out: { t: number; body: number; hair: number; ribbon: number; motion: number; reacting: boolean }[] = []
  for (let i = 0; i <= sec * fps; i++) {
    const now = i * dt * 1000
    const f = sim.step(inp, now, dt)
    const alpha = f.ribbon.get('c')!
    out.push({
      t: now,
      ribbon: alpha,
      body: f.layers.get('body')!.rotate + alpha, // 전체 각도 = 레이어 회전 + 끈 각도
      hair: f.layers.get('hair')!.rotate + alpha,
      motion: f.motion,
      reacting: f.reacting.get('c')!,
    })
  }
  return out
}

describe('swingSim', () => {
  it('같은 입력이면 항상 같은 결과 (저장한 영상이 매번 같음)', () => {
    const a = run(2, input())
    const b = run(2, input())
    expect(b.map((r) => r.body)).toEqual(a.map((r) => r.body))
  })

  it('밀기 전에는 가만히 있고, 밀면 흔들렸다가 시간이 지나면 가라앉음', () => {
    const rows = run(15, input())
    expect(rows[3].motion).toBe(0) // 밀기(100ms) 전
    expect(Math.max(...rows.map((r) => Math.abs(r.body)))).toBeGreaterThan(10)
    expect(rows[rows.length - 1].motion).toBeLessThan(0.5)
  })

  it('끈·몸·지연된 머리가 같은 방향으로 움직임 (반대 위상이 되지 않음)', () => {
    const rows = run(3, input())
    const corr = (xs: number[], ys: number[]) => {
      const mx = xs.reduce((a, b) => a + b) / xs.length
      const my = ys.reduce((a, b) => a + b) / ys.length
      let sxy = 0
      let sxx = 0
      let syy = 0
      xs.forEach((x, i) => {
        sxy += (x - mx) * (ys[i] - my)
        sxx += (x - mx) ** 2
        syy += (ys[i] - my) ** 2
      })
      return sxy / Math.sqrt(sxx * syy)
    }
    expect(corr(rows.map((r) => r.ribbon), rows.map((r) => r.body))).toBeGreaterThan(0.9)
    expect(corr(rows.map((r) => r.ribbon), rows.map((r) => r.hair))).toBeGreaterThan(0.5)
  })

  it('밀린 표정은 reactionSec 동안만', () => {
    const rows = run(3, input())
    expect(rows[3].reacting).toBe(false)
    expect(rows.find((r) => r.t > 500)!.reacting).toBe(true)
    expect(rows.find((r) => r.t > 1500)!.reacting).toBe(false)
  })

  it('차례대로 밀기: 두 번째 인원은 늦게 시작', () => {
    const inp = input({
      characters: [
        { id: 'c', swingStartedAt: 100, reactedAt: 100 },
        { id: 'd', swingStartedAt: 700, reactedAt: 700 },
      ],
      layers: [layer('body'), { ...layer('body2'), characterId: 'd' }],
    })
    const sim = createSimulation()
    let firstD = Infinity
    for (let i = 0; i <= 120; i++) {
      const f = sim.step(inp, (i / 60) * 1000, 1 / 60)
      if (Math.abs(f.ribbon.get('d')!) > 0.01 && firstD === Infinity) firstD = (i / 60) * 1000
    }
    expect(firstD).toBeGreaterThanOrEqual(700)
  })

  it('멈추기를 누르면 빠르게 가라앉음', () => {
    const sim = createSimulation()
    const base = input({ damping: 0.05 })
    let motionBefore = 0
    for (let i = 0; i <= 120; i++) motionBefore = sim.step(base, (i / 60) * 1000, 1 / 60).motion
    let motionAfter = motionBefore
    for (let i = 121; i <= 240; i++) motionAfter = sim.step({ ...base, stopAt: 1 }, (i / 60) * 1000, 1 / 60).motion
    expect(motionBefore).toBeGreaterThan(5)
    expect(motionAfter).toBeLessThan(motionBefore * 0.2)
  })
})
