import { useEffect, useRef } from 'react'
import { useSwingStore } from '../store/useSwingStore'
import { FIRE_BASE_OFFSET, FIRE_HEIGHT_RATIO, FIRE_WIDTH_RATIO, drawFlames } from '../utils/fire'

type FireProps = { attachY: number }

/** 매달린 인원 발밑의 불꽃 — 끈과 함께 흔들리지 않고 정지 상태의 그림 맨 아래에 고정 */
function Fire({ attachY }: FireProps) {
  const ribbonLength = useSwingStore((s) => s.ribbonLength)
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      drawFlames(ctx, w, h, performance.now() / 1000)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // 그림 박스 맨 아래(= 끈 길이 + 박스 높이 70% − 끈 위치만큼) 바로 아래가 불꽃 밑면
  const top = `calc(${ribbonLength}px + ${(FIRE_BASE_OFFSET + 0.7 * (1 - attachY) - FIRE_HEIGHT_RATIO) * 100}%)`
  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: `${((1 - FIRE_WIDTH_RATIO) / 2) * 100}%`,
        width: `${FIRE_WIDTH_RATIO * 100}%`,
        top,
        height: `${FIRE_HEIGHT_RATIO * 100}%`,
      }}
    />
  )
}

export default Fire
