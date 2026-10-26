import { useEffect, useRef, type CSSProperties } from 'react'
import { ROPE_LOOK, drawRopeLine } from '../utils/rope'

type RopeCordProps = {
  horizontal?: boolean // 가로대(true) / 세로로 매달린 끈(false)
  className?: string
  style?: CSSProperties // 크기와 위치는 부모가 정한다. 짧은 쪽 길이가 밧줄 굵기
}

/** 꼬인 밧줄 모양의 끈 (리본 그림이 없을 때의 기본 끈과 가로대). 크기가 바뀔 때만 다시 그린다 */
function RopeCord({ horizontal = false, className, style }: RopeCordProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const draw = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w <= 0 || h <= 0) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      const ctx = canvas.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (horizontal) drawRopeLine(ctx, { x: 0, y: h / 2 }, { x: w, y: h / 2 }, h, ROPE_LOOK)
      else drawRopeLine(ctx, { x: w / 2, y: 0 }, { x: w / 2, y: h }, w, ROPE_LOOK)
    }
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [horizontal])

  return <canvas ref={ref} aria-hidden className={className} style={style} />
}

export default RopeCord
