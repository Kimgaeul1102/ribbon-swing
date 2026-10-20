import { useEffect } from 'react'
import { useSwingStore } from '../store/useSwingStore'
import { SWAY_STRIPS, pendulumAngle, swayShift, swayStiffness, wobbleTransform } from '../utils/pendulum'
import { RingBuffer } from '../utils/ringBuffer'
import { layerElements } from '../utils/layerElements'

/**
 * rAF 루프 — 캐릭터별 진자 계산 + 레이어 스프링 추종.
 * 애니메이션 값은 state가 아닌 클로저에 두고 DOM style.transform을 직접 갱신한다.
 */
export function useSwingLoop(): void {
  useEffect(() => {
    const histories = new Map<string, RingBuffer>() // 캐릭터별 메인 각도 기록 (delay용)
    const angles = new Map<string, number>() // 레이어별 현재 각도
    const sways = new Map<string, Float32Array>() // 레이어별 띠(strip)마다의 현재 가로 이동량 (%)
    const reacting = new Map<string, boolean>() // 캐릭터별 "밀린 상태" 여부 (매 프레임 갱신)
    let last = performance.now()
    let raf = 0

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      const { amplitude, frequency, damping, wobble, sway, reactionSec, characters, layers } = useSwingStore.getState()

      for (const c of characters) {
        let history = histories.get(c.id)
        if (!history) histories.set(c.id, (history = new RingBuffer(128)))
        const t = Math.max(0, (now - c.swingStartedAt) / 1000)
        history.push(now, pendulumAngle(t, amplitude, frequency, damping))
        reacting.set(c.id, c.reactedAt > 0 && now >= c.reactedAt && now < c.reactedAt + reactionSec * 1000)
      }

      for (const layer of layers) {
        const el = layerElements.get(layer.id)
        const history = histories.get(layer.characterId)
        if (!el || !history) continue
        const target = history.sampleAt(now - layer.delay) * layer.amplitudeMul
        const prev = angles.get(layer.id) ?? 0
        // 프레임레이트와 무관하게 같은 속도로 따라오도록 보정 (stiffness 1이면 즉시 추종)
        const k = 1 - Math.pow(1 - layer.stiffness, dt * 60)
        const angle = prev + (target - prev) * k
        angles.set(layer.id, angle)

        // 표정 교체: 평소에만/밀렸을 때만 보이는 레이어 토글
        const isReacting = reacting.get(layer.characterId) ?? false
        el.style.display =
          (layer.expression === 'normal' && isReacting) || (layer.expression === 'hit' && !isReacting) ? 'none' : ''

        const velocity = dt > 0 ? (angle - prev) / dt : 0
        const { skew, scaleY } = wobbleTransform(wobble, velocity)
        el.style.transform = `rotate(${angle}deg) skewX(${skew}deg) scaleY(${scaleY})`

        // 아래로 갈수록 더 크고 늦게/부드럽게 흔들리는 효과. children[0]은 기준 이미지, 1..N이 띠
        if (sway > 0 && el.childElementCount > SWAY_STRIPS) {
          let shifts = sways.get(layer.id)
          if (!shifts) sways.set(layer.id, (shifts = new Float32Array(SWAY_STRIPS)))
          const span = Math.max(1 - layer.pivot.y, 0.01)
          for (let i = 0; i < SWAY_STRIPS; i++) {
            const depth = Math.min(1, Math.max(0, (i + 0.5) / SWAY_STRIPS - layer.pivot.y) / span)
            const rate = 1 - Math.pow(1 - swayStiffness(depth), dt * 60)
            shifts[i] += (swayShift(angle, depth, sway) - shifts[i]) * rate
            ;(el.children[i + 1] as HTMLElement).style.transform = `translateX(${shifts[i]}%)`
          }
        }
      }

      // 지워진 캐릭터/레이어의 기록 정리
      if (angles.size > layers.length) {
        const alive = new Set(layers.map((l) => l.id))
        for (const id of angles.keys()) if (!alive.has(id)) angles.delete(id)
        for (const id of sways.keys()) if (!alive.has(id)) sways.delete(id)
      }
      if (histories.size > characters.length) {
        const alive = new Set(characters.map((c) => c.id))
        for (const id of histories.keys()) if (!alive.has(id)) histories.delete(id)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
}
