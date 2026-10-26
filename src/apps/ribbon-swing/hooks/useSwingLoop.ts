import { useEffect } from 'react'
import { useSwingStore } from '../store/useSwingStore'
import { createSimulation } from '../sim/swingSim'
import { layerElements, ribbonElements } from '../utils/layerElements'
import { cookFilter, cookStep, getCook, setCook } from '../utils/fire'

/**
 * rAF 루프 — 움직임 계산(sim/swingSim.ts)을 실제 시간으로 돌리고 결과를 DOM style.transform에 직접 반영한다.
 * 애니메이션 값은 React state가 아니라 시뮬레이션 안에 둬서 리렌더 없이 갱신한다.
 * transform만 쓰므로 레이아웃/페인트 없이 GPU 합성만으로 그려진다.
 */
export function useSwingLoop(): void {
  useEffect(() => {
    const sim = createSimulation(useSwingStore.getState().stopAt)
    let last = performance.now()
    let raf = 0
    let lastFilter = ''

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      const state = useSwingStore.getState()
      const frame = sim.step(state, now, dt)

      // 불이 켜져 있으면 서서히 익음. 필터는 CSS 변수로 한 번에 넘기고, 값이 바뀔 때만 씀
      const cook = cookStep(getCook(), state.fireOn, dt)
      setCook(cook)
      const filter = cookFilter(cook)
      if (filter !== lastFilter) {
        lastFilter = filter
        document.querySelector<HTMLElement>('[data-stage]')?.style.setProperty('--cook-filter', filter)
      }

      for (const [characterId, alpha] of frame.ribbon) {
        const el = ribbonElements.get(characterId)
        if (el) el.style.transform = `rotate(${alpha}deg)`
      }
      for (const [layerId, pose] of frame.layers) {
        const el = layerElements.get(layerId)
        if (!el) continue
        el.style.display = pose.visible ? '' : 'none'
        el.style.transform =
          `rotate(${pose.rotate}deg) skewX(${pose.skew}deg) scale(${pose.scaleX}, ${pose.scaleY})`
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
}
