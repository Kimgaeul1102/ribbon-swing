import { useEffect, type RefObject } from 'react'
import { easeCamera, targetCamera } from '../render/camera'
import { drawScene } from '../render/drawScene'
import { createSim, stepSim, STEP_MS } from '../sim/marbleSim'
import { buildSimConfig, useMarbleStore } from '../store/useMarbleStore'

const MAX_STEPS_PER_FRAME = 8 // 탭이 멈췄다 돌아와도 한꺼번에 몰아서 계산하지 않게

/**
 * rAF 루프: 실제 시간을 고정 간격(STEP_MS) 물리 스텝으로 바꿔 진행하고 canvas에 그린다.
 * 설정이 바뀌어 runId가 오르면 시뮬레이션을 새로 만들어 처음부터 시작.
 * 슬라이더 값은 매 프레임 getState()로 읽음 (리렌더 없음)
 */
export function useMarbleLoop(canvasRef: RefObject<HTMLCanvasElement>) {
  const runId = useMarbleStore((s) => s.runId)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const sim = createSim(buildSimConfig(useMarbleStore.getState()))
    let camera = targetCamera(sim, useMarbleStore.getState().followCamera)
    let acc = 0
    let last = performance.now()
    let finishT: number | null = null
    let reported = { count: -1, done: false }
    let raf = 0

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const s = useMarbleStore.getState()

      if (s.playing && !sim.done) {
        acc += dt * 1000 * (s.slow ? 0.5 : 1)
        for (let n = 0; acc >= STEP_MS && n < MAX_STEPS_PER_FRAME && !sim.done; n++) {
          stepSim(sim)
          acc -= STEP_MS
        }
        if (acc > STEP_MS * MAX_STEPS_PER_FRAME) acc = 0
      }
      if (sim.done) finishT = (finishT ?? 0) + (s.playing ? dt : 0)

      // 순위판은 골인 순서가 바뀔 때만 React에 알림
      if (sim.order.length !== reported.count || sim.done !== reported.done) {
        reported = { count: sim.order.length, done: sim.done }
        s.setProgress([...sim.order], sim.done)
      }

      camera = easeCamera(camera, targetCamera(sim, s.followCamera))
      drawScene(ctx, sim, { camera, overlaySrc: s.trackOverlay, finishT })
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [canvasRef, runId])
}
