import type { Layer } from '../store/useSwingStore'
import { applyPush, idleAngle, jellyStretch, oscillator, pushDirection, stepSpring, swaySkew } from '../utils/pendulum'
import { seedFromId } from '../utils/id'

/**
 * 움직임 시뮬레이션 — DOM과 상관없는 순수 계산.
 * 화면(useSwingLoop)은 실제 시간으로, 영상/GIF 저장(export)은 일정한 간격의 가상 시간으로 똑같이 돌린다.
 * "밀기"는 진동을 처음부터 다시 시작하는 게 아니라 지금 움직임에 속도를 더하는 충격이라,
 * 흔들리는 중에 또 누르면 그 위에 힘이 얹힌다. 시간 단위는 ms.
 */

const MIN_DT = 0.004 // 초 (250fps)

/** 말랑하게 늘어날 때 가로는 세로 늘어남의 이 비율만큼 줄어듦 (부피 유지 느낌) */
const JELLY_SQUASH = 0.6
const JELLY_OMEGA = 16 // 늘어남 스프링은 기울임보다 살짝 빠르고 통통 튀게
const JELLY_ZETA = 0.3
const IDLE_FADE_RATE = 2.5 // 계속 흔들기를 켜고 끌 때 부드럽게 전환되는 속도 (1/초)
const MAX_PUSH_AGE_MS = 2000 // 이보다 오래된 밀기는 (나중에 만든 레이어 등) 뒤늦게 적용하지 않음
const BRAKE_MS = 1200 // 멈추기를 누른 뒤 브레이크가 걸려 있는 시간
const BRAKE_VELOCITY_RATE = 7 // 브레이크 중 속도가 줄어드는 비율 (1/초)
const BRAKE_ANGLE_RATE = 2.5 // 브레이크 중 각도가 0으로 돌아오는 비율 (1/초)

type Spring = { x: number; v: number }

/** 시뮬레이션이 읽는 값 (스토어 상태에서 그대로 넘기면 됨) */
export type SimInput = {
  amplitude: number
  frequency: number
  damping: number
  wobble: number
  sway: number
  reactionSec: number
  idleOn: boolean
  idleStrength: number
  ribbonSwing: number
  stopAt: number
  characters: { id: string; swingStartedAt: number; reactedAt: number }[]
  layers: Pick<
    Layer,
    'id' | 'characterId' | 'delay' | 'speedMul' | 'amplitudeMul' | 'stiffness' | 'waveMul' | 'swayMul' | 'expression'
  >[]
}

/** 한 레이어의 이번 프레임 자세. transform = rotate(rotate) skewX(skew) scale(scaleX, scaleY) */
export type LayerPose = {
  rotate: number // deg (레이어 자기 기준점 기준, 끈 각도를 뺀 값)
  skew: number // deg
  scaleX: number
  scaleY: number
  visible: boolean // 표정 교체: 평소에만/밀렸을 때만
}

export type SimFrame = {
  ribbon: Map<string, number> // 캐릭터별 끈 각도 (deg, 위쪽 가로대 기준)
  layers: Map<string, LayerPose>
  reacting: Map<string, boolean> // 캐릭터별 "밀린 상태" (표정/뿅뿅)
  /** 아직 얼마나 흔들리는지(deg) — 끈과 모든 레이어 진동 진폭 중 최대. 저장할 때 "흔들림이 끝났는지" 판단에 씀 */
  motion: number
}

export type Simulation = {
  /** now(ms)까지 dt(초)만큼 진행. 반환값은 다음 step 전까지만 유효 (같은 객체를 재사용) */
  step: (input: SimInput, now: number, dt: number) => SimFrame
}

export function createSimulation(initialStopAt = 0): Simulation {
  const pushes = new Map<string, number>() // 캐릭터별 마지막 밀기 시각
  const oscillators = new Map<string, Spring>() // 레이어별 진동 상태 (각도 deg, 각속도 deg/s)
  const applied = new Map<string, number>() // 레이어별로 이미 적용한 밀기 시각
  const angles = new Map<string, number>() // 레이어별 현재(스프링으로 따라간) 각도
  const ribbonOscs = new Map<string, Spring>() // 캐릭터별 리본 끈 진동 상태
  const ribbonApplied = new Map<string, number>() // 캐릭터별로 리본이 이미 적용한 밀기 시각
  const pushDirs = new Map<string, { pushAt: number; dir: 1 | -1 }>() // 캐릭터별 밀기 방향 (끈이 정하고 레이어들이 따라감)
  const velocities = new Map<string, number>() // 레이어별 각속도 (말랑함 세기용)
  const swaySprings = new Map<string, Spring>() // 레이어별 아래로 갈수록 기울임 스프링 (deg)
  const jellySprings = new Map<string, Spring>() // 레이어별 말랑함 늘어남 스프링 (비율)
  const idleGains = new Map<string, number>() // 캐릭터별 계속 흔들기 세기 비율 0~1 (켜고 끌 때 서서히 변함)
  const seeds = new Map<string, number>() // 캐릭터별 흔들림 위상 (인원마다 다르게)
  let lastStop = initialStopAt
  let brakeUntil = 0

  const frame: SimFrame = { ribbon: new Map(), layers: new Map(), reacting: new Map(), motion: 0 }

  const step = (input: SimInput, now: number, dt: number): SimFrame => {
    const { amplitude, frequency, damping, wobble, sway, reactionSec, idleOn, idleStrength, ribbonSwing, stopAt } = input
    const { characters, layers } = input
    frame.motion = 0
    frame.ribbon.clear()
    frame.layers.clear()

    for (const c of characters) {
      pushes.set(c.id, c.swingStartedAt)
      let seed = seeds.get(c.id)
      if (seed === undefined) seeds.set(c.id, (seed = seedFromId(c.id)))
      const gain = idleGains.get(c.id) ?? 0
      idleGains.set(c.id, gain + ((idleOn ? 1 : 0) - gain) * (1 - Math.exp(-dt * IDLE_FADE_RATE)))
      frame.reacting.set(c.id, c.reactedAt > 0 && now >= c.reactedAt && now < c.reactedAt + reactionSec * 1000)
    }

    // 멈추기: 한동안 브레이크를 걸고, 아직 시작 안 한(차례대로 밀기로 예약된) 밀기는 취소
    if (stopAt !== lastStop) {
      lastStop = stopAt
      brakeUntil = now + BRAKE_MS
      for (const layer of layers) {
        const pushAt = pushes.get(layer.characterId)
        if (pushAt !== undefined) applied.set(layer.id, pushAt)
      }
      for (const c of characters) ribbonApplied.set(c.id, c.swingStartedAt)
    }
    const braking = now < brakeUntil

    // 리본 끈: 위쪽 가로대를 기준으로 매달린 진자처럼 흔들림. 캐릭터(끈 끝)가 호를 그리며 움직임.
    // 캐릭터 전체 방향은 그대로 두려고, 레이어는 아래에서 끈 각도만큼 빼서 회전함.
    for (const c of characters) {
      let ro = ribbonOscs.get(c.id)
      if (!ro) ribbonOscs.set(c.id, (ro = { x: 0, v: 0 }))
      const { w, omega, zeta } = oscillator(frequency, damping, 1)
      if (ribbonApplied.get(c.id) !== c.swingStartedAt && now >= c.swingStartedAt) {
        ribbonApplied.set(c.id, c.swingStartedAt)
        // 방향은 끈(기준 진동)이 정하고, 같은 인원의 레이어들은 지연 후에 같은 방향으로 밀림
        const dir = pushDirection(ro)
        pushDirs.set(c.id, { pushAt: c.swingStartedAt, dir })
        if (now - c.swingStartedAt < MAX_PUSH_AGE_MS) applyPush(ro, amplitude, w, dir)
      }
      stepSpring(ro, 0, dt, omega, zeta)
      if (braking) {
        ro.v *= Math.exp(-dt * BRAKE_VELOCITY_RATE)
        ro.x *= Math.exp(-dt * BRAKE_ANGLE_RATE)
      }
      const ribbonIdle = idleAngle(now / 1000, idleStrength * (idleGains.get(c.id) ?? 0), frequency, seeds.get(c.id) ?? 0)
      frame.ribbon.set(c.id, (ro.x + ribbonIdle) * ribbonSwing)
      frame.motion = Math.max(frame.motion, Math.hypot(ro.x, ro.v / omega) * ribbonSwing)
    }

    for (const layer of layers) {
      const pushAt = pushes.get(layer.characterId)
      if (pushAt === undefined) continue

      // 이 레이어의 진동. 레이어마다 속도(speedMul)가 달라서 진동수/감쇠도 그만큼 빠르거나 느림
      let osc = oscillators.get(layer.id)
      if (!osc) oscillators.set(layer.id, (osc = { x: 0, v: 0 }))
      const { w, omega, zeta } = oscillator(frequency, damping, layer.speedMul)

      // 밀기: 새 밀기가 도착하면 (delay만큼 늦게) 지금 속도에 충격을 더함 — 처음으로 되돌아가지 않음
      const pushTime = pushAt + layer.delay
      if (applied.get(layer.id) !== pushAt && now >= pushTime) {
        applied.set(layer.id, pushAt)
        if (now - pushTime < MAX_PUSH_AGE_MS) {
          const shared = pushDirs.get(layer.characterId)
          applyPush(osc, amplitude, w, shared?.pushAt === pushAt ? shared.dir : undefined)
        }
      }
      stepSpring(osc, 0, dt, omega, zeta)
      if (braking) {
        osc.v *= Math.exp(-dt * BRAKE_VELOCITY_RATE)
        osc.x *= Math.exp(-dt * BRAKE_ANGLE_RATE)
      }
      frame.motion = Math.max(frame.motion, Math.hypot(osc.x, osc.v / omega) * layer.amplitudeMul)

      // 계속 흔들기: 밀기 흔들림 위에 잔잔한 흔들림을 더함. 레이어의 delay/속도도 똑같이 적용돼서 머리카락 등이 자연스럽게 늦게 따라옴
      const idle = idleAngle(
        ((now - layer.delay) / 1000) * layer.speedMul,
        idleStrength * (idleGains.get(layer.characterId) ?? 0),
        frequency,
        seeds.get(layer.characterId) ?? 0,
      )
      const target = (osc.x + idle) * layer.amplitudeMul
      const prev = angles.get(layer.id) ?? 0
      // 프레임레이트와 무관하게 같은 속도로 따라오도록 보정 (stiffness 1이면 즉시 추종)
      const k = 1 - Math.pow(1 - layer.stiffness, dt * 60)
      const angle = prev + (target - prev) * k
      angles.set(layer.id, angle)

      // 프레임 간격이 너무 짧으면(콜백이 연달아 호출될 때) 각속도가 폭주하므로 이전 값을 유지
      const velocity = dt >= MIN_DT ? (angle - prev) / dt : (velocities.get(layer.id) ?? 0)
      velocities.set(layer.id, velocity)

      // 아래로 갈수록: 몸이 기운 쪽으로 아래가 더 쏠리는 기울임을 스프링으로 부드럽게 (회전 기준점이 위라 아래로 갈수록 크게 움직임)
      let swaySpring = swaySprings.get(layer.id)
      if (!swaySpring) swaySprings.set(layer.id, (swaySpring = { x: 0, v: 0 }))
      stepSpring(swaySpring, swaySkew(angle, sway * layer.swayMul), dt)

      // 말랑함: 빠르게 움직이면 세로로 늘어났다가 통통 튀며 돌아옴 (waveMul은 이 레이어의 말랑함 배율)
      let jellySpring = jellySprings.get(layer.id)
      if (!jellySpring) jellySprings.set(layer.id, (jellySpring = { x: 0, v: 0 }))
      stepSpring(jellySpring, jellyStretch(wobble * layer.waveMul, velocity), dt, JELLY_OMEGA, JELLY_ZETA)

      // 표정 교체: 평소에만/밀렸을 때만 보이는 레이어 토글
      const isReacting = frame.reacting.get(layer.characterId) ?? false
      frame.layers.set(layer.id, {
        rotate: angle - (frame.ribbon.get(layer.characterId) ?? 0),
        skew: swaySpring.x,
        scaleX: 1 - jellySpring.x * JELLY_SQUASH,
        scaleY: 1 + jellySpring.x,
        visible: !((layer.expression === 'normal' && isReacting) || (layer.expression === 'hit' && !isReacting)),
      })
    }

    // 지워진 레이어/캐릭터의 기록 정리
    if (angles.size > layers.length) {
      const alive = new Set(layers.map((l) => l.id))
      for (const map of [oscillators, applied, angles, velocities, swaySprings, jellySprings]) {
        for (const id of map.keys()) if (!alive.has(id)) map.delete(id)
      }
    }
    if (ribbonOscs.size > characters.length) {
      const alive = new Set(characters.map((c) => c.id))
      for (const map of [ribbonOscs, ribbonApplied, pushDirs]) {
        for (const id of map.keys()) if (!alive.has(id)) map.delete(id)
      }
    }
    return frame
  }

  return { step }
}
