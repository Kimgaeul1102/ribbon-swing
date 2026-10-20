import { useEffect } from 'react'
import { useSwingStore } from '../store/useSwingStore'
import { jellyStretch, pendulumAngle, stepSpring, swaySkew } from '../utils/pendulum'
import { layerElements } from '../utils/layerElements'

const MIN_DT = 0.004 // 초 (250fps)

/** 말랑하게 늘어날 때 가로는 세로 늘어남의 이 비율만큼 줄어듦 (부피 유지 느낌) */
const JELLY_SQUASH = 0.6
const JELLY_OMEGA = 16 // 늘어남 스프링은 기울임보다 살짝 빠르고 통통 튀게
const JELLY_ZETA = 0.3

type Spring = { x: number; v: number }

/**
 * rAF 루프 — 캐릭터별 진자 계산 + 레이어 스프링 추종.
 * 애니메이션 값은 state가 아닌 클로저에 두고 DOM style.transform을 직접 갱신한다.
 * transform만 쓰므로 레이아웃/페인트 없이 GPU 합성만으로 그려진다.
 */
export function useSwingLoop(): void {
  useEffect(() => {
    const starts = new Map<string, number>() // 캐릭터별 진자 t=0 시각 (매 프레임 갱신)
    const angles = new Map<string, number>() // 레이어별 현재 각도
    const velocities = new Map<string, number>() // 레이어별 각속도 (말랑함 세기용)
    const swaySprings = new Map<string, Spring>() // 레이어별 아래로 갈수록 기울임 스프링 (deg)
    const jellySprings = new Map<string, Spring>() // 레이어별 말랑함 늘어남 스프링 (비율)
    const reacting = new Map<string, boolean>() // 캐릭터별 "밀린 상태" 여부 (매 프레임 갱신)
    let last = performance.now()
    let raf = 0

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      const { amplitude, frequency, damping, wobble, sway, reactionSec, characters, layers } =
        useSwingStore.getState()

      for (const c of characters) {
        starts.set(c.id, c.swingStartedAt)
        reacting.set(c.id, c.reactedAt > 0 && now >= c.reactedAt && now < c.reactedAt + reactionSec * 1000)
      }

      for (const layer of layers) {
        const el = layerElements.get(layer.id)
        const start = starts.get(layer.characterId)
        if (!el || start === undefined) continue
        // 레이어 자신의 진자: delay만큼 늦게 시작하고, speedMul만큼 시간이 빠르게/느리게 흐름
        const t = (Math.max(0, now - start - layer.delay) / 1000) * layer.speedMul
        const target = pendulumAngle(t, amplitude, frequency, damping) * layer.amplitudeMul
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
          `rotate(${angle}deg) skewX(${swaySpring.x}deg) ` +
          `scale(${1 - jellySpring.x * JELLY_SQUASH}, ${1 + jellySpring.x})`
      }

      // 지워진 레이어의 기록 정리
      if (angles.size > layers.length) {
        const alive = new Set(layers.map((l) => l.id))
        for (const id of angles.keys()) if (!alive.has(id)) angles.delete(id)
        for (const id of velocities.keys()) if (!alive.has(id)) velocities.delete(id)
        for (const id of swaySprings.keys()) if (!alive.has(id)) swaySprings.delete(id)
        for (const id of jellySprings.keys()) if (!alive.has(id)) jellySprings.delete(id)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
}
