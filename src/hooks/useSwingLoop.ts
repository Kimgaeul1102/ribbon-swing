import { useEffect } from 'react'
import { useSwingStore } from '../store/useSwingStore'
import { applyPush, idleAngle, jellyStretch, oscillator, stepSpring, swaySkew } from '../utils/pendulum'
import { seedFromId } from '../utils/id'
import { layerElements, ribbonElements } from '../utils/layerElements'

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

/**
 * rAF 루프 — 레이어마다 자기 진동(감쇠 진자)을 돌리고 스프링으로 따라가게 한다.
 * "밀기"는 진동을 처음부터 다시 시작하는 게 아니라 지금 움직임에 속도를 더하는 충격이라,
 * 흔들리는 중에 또 누르면 그 위에 힘이 얹힌다.
 * 애니메이션 값은 state가 아닌 클로저에 두고 DOM style.transform을 직접 갱신한다.
 * transform만 쓰므로 레이아웃/페인트 없이 GPU 합성만으로 그려진다.
 */
export function useSwingLoop(): void {
  useEffect(() => {
    const pushes = new Map<string, number>() // 캐릭터별 마지막 밀기 시각 (매 프레임 갱신)
    const oscillators = new Map<string, Spring>() // 레이어별 진동 상태 (각도 deg, 각속도 deg/s)
    const applied = new Map<string, number>() // 레이어별로 이미 적용한 밀기 시각
    const angles = new Map<string, number>() // 레이어별 현재(스프링으로 따라간) 각도
    const ribbonOscs = new Map<string, Spring>() // 캐릭터별 리본 끈 진동 상태
    const ribbonApplied = new Map<string, number>() // 캐릭터별로 리본이 이미 적용한 밀기 시각
    const ribbonAngles = new Map<string, number>() // 캐릭터별 리본 끈 각도 (deg, 위쪽 가로대 기준)
    const velocities = new Map<string, number>() // 레이어별 각속도 (말랑함 세기용)
    const swaySprings = new Map<string, Spring>() // 레이어별 아래로 갈수록 기울임 스프링 (deg)
    const jellySprings = new Map<string, Spring>() // 레이어별 말랑함 늘어남 스프링 (비율)
    const idleGains = new Map<string, number>() // 캐릭터별 계속 흔들기 세기 비율 0~1 (켜고 끌 때 서서히 변함)
    const seeds = new Map<string, number>() // 캐릭터별 흔들림 위상 (인원마다 다르게)
    const reacting = new Map<string, boolean>() // 캐릭터별 "밀린 상태" 여부 (매 프레임 갱신)
    let lastStop = useSwingStore.getState().stopAt
    let brakeUntil = 0
    let last = performance.now()
    let raf = 0

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      const { amplitude, frequency, damping, wobble, sway, reactionSec, idleOn, idleStrength, ribbonSwing, stopAt, characters, layers } =
        useSwingStore.getState()

      for (const c of characters) {
        pushes.set(c.id, c.swingStartedAt)
        let seed = seeds.get(c.id)
        if (seed === undefined) seeds.set(c.id, (seed = seedFromId(c.id)))
        const gain = idleGains.get(c.id) ?? 0
        idleGains.set(c.id, gain + ((idleOn ? 1 : 0) - gain) * (1 - Math.exp(-dt * IDLE_FADE_RATE)))
        reacting.set(c.id, c.reactedAt > 0 && now >= c.reactedAt && now < c.reactedAt + reactionSec * 1000)
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
          if (now - c.swingStartedAt < MAX_PUSH_AGE_MS) applyPush(ro, amplitude, w)
        }
        stepSpring(ro, 0, dt, omega, zeta)
        if (braking) {
          ro.v *= Math.exp(-dt * BRAKE_VELOCITY_RATE)
          ro.x *= Math.exp(-dt * BRAKE_ANGLE_RATE)
        }
        const ribbonIdle = idleAngle(now / 1000, idleStrength * (idleGains.get(c.id) ?? 0), frequency, seeds.get(c.id) ?? 0)
        const alpha = (ro.x + ribbonIdle) * ribbonSwing
        ribbonAngles.set(c.id, alpha)
        const ribbonEl = ribbonElements.get(c.id)
        if (ribbonEl) ribbonEl.style.transform = `rotate(${alpha}deg)`
      }

      for (const layer of layers) {
        const el = layerElements.get(layer.id)
        const pushAt = pushes.get(layer.characterId)
        if (!el || pushAt === undefined) continue

        // 이 레이어의 진동. 레이어마다 속도(speedMul)가 달라서 진동수/감쇠도 그만큼 빠르거나 느림
        let osc = oscillators.get(layer.id)
        if (!osc) oscillators.set(layer.id, (osc = { x: 0, v: 0 }))
        const { w, omega, zeta } = oscillator(frequency, damping, layer.speedMul)

        // 밀기: 새 밀기가 도착하면 (delay만큼 늦게) 지금 속도에 충격을 더함 — 처음으로 되돌아가지 않음
        const pushTime = pushAt + layer.delay
        if (applied.get(layer.id) !== pushAt && now >= pushTime) {
          applied.set(layer.id, pushAt)
          if (now - pushTime < MAX_PUSH_AGE_MS) applyPush(osc, amplitude, w)
        }
        stepSpring(osc, 0, dt, omega, zeta)
        if (braking) {
          osc.v *= Math.exp(-dt * BRAKE_VELOCITY_RATE)
          osc.x *= Math.exp(-dt * BRAKE_ANGLE_RATE)
        }

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

        // 표정 교체: 평소에만/밀렸을 때만 보이는 레이어 토글
        const isReacting = reacting.get(layer.characterId) ?? false
        el.style.display =
          (layer.expression === 'normal' && isReacting) || (layer.expression === 'hit' && !isReacting) ? 'none' : ''

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

        el.style.transform =
          `rotate(${angle - (ribbonAngles.get(layer.characterId) ?? 0)}deg) skewX(${swaySpring.x}deg) ` +
          `scale(${1 - jellySpring.x * JELLY_SQUASH}, ${1 + jellySpring.x})`
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
        for (const map of [ribbonOscs, ribbonApplied, ribbonAngles]) {
          for (const id of map.keys()) if (!alive.has(id)) map.delete(id)
        }
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
}
