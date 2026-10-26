import Matter from 'matter-js'
import type { SimConfig } from '../types'
import { buildTrack, pickStartPoints, type TrackBodies } from '../track/buildBodies'
import { makeRng } from './rng'

const { Engine, Bodies, Body, Events, Composite } = Matter

/** 물리는 항상 이 간격으로만 진행 → 프레임 녹화나 재시작을 해도 결과가 같음 */
export const STEP_MS = 1000 / 60

export type MarbleState = {
  id: string
  name: string
  color: string
  body: Matter.Body
  finishTime: number | null // 골인한 시뮬레이션 시간(초)
}

export type MarbleSim = {
  config: SimConfig
  engine: Matter.Engine
  track: TrackBodies
  marbles: MarbleState[]
  time: number // 시뮬레이션 시간(초)
  order: string[] // 골인 순서 (캐릭터 id)
  done: boolean
  doneTime: number | null
}

/** 설정으로부터 새 시뮬레이션을 만든다 (같은 config면 항상 같은 결과) */
export function createSim(config: SimConfig): MarbleSim {
  const rng = makeRng(config.seed)
  const engine = Engine.create({ gravity: { x: 0, y: config.gravity } })
  const track = buildTrack(config.preset.track, config.preset.worldH, rng)
  Composite.add(engine.world, track.bodies)
  Composite.add(engine.world, track.constraints)

  const { marble } = config
  const starts = pickStartPoints(config.preset.start, config.characters.length, marble.radius, rng)
  const marbles: MarbleState[] = config.characters.map((c, i) => {
    const body = Bodies.circle(starts[i].x, starts[i].y, marble.radius, {
      label: `marble:${c.id}`,
      restitution: marble.restitution,
      friction: marble.friction,
      frictionAir: marble.frictionAir,
      density: marble.density,
    })
    return { id: c.id, name: c.name, color: c.color, body, finishTime: null }
  })
  Composite.add(engine.world, marbles.map((m) => m.body))

  const sim: MarbleSim = { config, engine, track, marbles, time: 0, order: [], done: false, doneTime: null }

  // 골 센서에 닿은 순서 기록
  Events.on(engine, 'collisionStart', (ev) => {
    for (const { bodyA, bodyB } of ev.pairs) {
      const goal = bodyA.label === 'goal' ? bodyA : bodyB.label === 'goal' ? bodyB : null
      if (!goal) continue
      const other = goal === bodyA ? bodyB : bodyA
      const m = sim.marbles.find((x) => x.body === other)
      if (m && m.finishTime === null) {
        m.finishTime = sim.time
        sim.order.push(m.id)
      }
    }
  })
  return sim
}

/** 한 스텝(1/60초) 진행 */
export function stepSim(sim: MarbleSim): void {
  if (sim.done) return
  const dt = STEP_MS / 1000
  for (const s of sim.track.spinners) {
    Body.setAngle(s.body, s.body.angle + s.speed * dt)
    Body.setAngularVelocity(s.body, s.speed * dt)
  }
  Engine.update(sim.engine, STEP_MS)
  // 시소가 한 바퀴 돌아버리지 않게 각도 제한
  const limit = 0.45
  for (const s of sim.track.seesaws) {
    if (Math.abs(s.body.angle) > limit) {
      Body.setAngle(s.body, Math.sign(s.body.angle) * limit)
      Body.setAngularVelocity(s.body, 0)
    }
  }
  sim.time += dt
  const allIn = sim.marbles.every((m) => m.finishTime !== null)
  if (allIn || sim.time >= sim.config.timeoutSec) {
    sim.done = true
    sim.doneTime = sim.time
  }
}

/** 순위(등수 순). 골인 못한 구슬은 뒤에, 아래쪽에 있는 순으로 */
export function ranking(sim: MarbleSim): MarbleState[] {
  const byId = new Map(sim.marbles.map((m) => [m.id, m]))
  const finished = sim.order.map((id) => byId.get(id)!)
  const rest = sim.marbles.filter((m) => m.finishTime === null).sort((a, b) => b.body.position.y - a.body.position.y)
  return [...finished, ...rest]
}
