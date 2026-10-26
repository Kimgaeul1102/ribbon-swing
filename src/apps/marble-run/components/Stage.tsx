import { useRef } from 'react'
import { useMarbleLoop } from '../hooks/useMarbleLoop'
import { VIEW_H, VIEW_W } from '../render/camera'
import Scoreboard from './Scoreboard'

/** 레이스 화면: canvas(2배 해상도) + 우측 상단 순위판 */
function Stage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useMarbleLoop(canvasRef)

  return (
    <div className="flex h-full w-full items-center justify-center bg-pink-50 p-2">
      <div className="relative h-full max-w-full" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}>
        <canvas
          ref={canvasRef}
          width={VIEW_W * 2}
          height={VIEW_H * 2}
          className="h-full w-full rounded-xl border border-pink-200 shadow"
        />
        <Scoreboard />
      </div>
    </div>
  )
}

export default Stage
