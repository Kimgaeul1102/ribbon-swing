import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { wrap } from './curves'
import { downloadBlob, recordCanvas } from './recorder'
import { STAGE, useLoopSettings } from './useLoopSettings'

/** 장면 그리기 함수. t = 루프 안의 시간(초, 0 ≤ t < loop). 마지막 프레임과 첫 프레임이 이어지도록 만들 것 */
export type DrawFn = (ctx: CanvasRenderingContext2D, t: number, loop: number) => void

export type LoopPlayer = {
  playing: boolean
  recording: boolean
  togglePlay: () => void
  step: (dir: 1 | -1) => void
  record: () => void
  getTime: () => number
}

/**
 * rAF 루프: 시간 t를 [0, loop)에서 돌리며 매 프레임 canvas를 지우고 draw를 호출.
 * draw/슬라이더 값은 매 프레임 최신 것을 읽음 (리렌더 없음)
 */
export function useLoopPlayer(canvasRef: RefObject<HTMLCanvasElement>, draw: DrawFn): LoopPlayer {
  const tRef = useRef(0)
  const playingRef = useRef(true)
  const drawRef = useRef(draw)
  drawRef.current = draw
  const [playing, setPlayingState] = useState(true)
  const [recording, setRecording] = useState(false)

  const setPlaying = useCallback((on: boolean) => {
    playingRef.current = on
    setPlayingState(on)
  }, [])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) {
        const { loopSec, bg, stageW, stageH } = useLoopSettings.getState()
        tRef.current = wrap(tRef.current + (playingRef.current ? dt : 0), loopSec)
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, stageW, stageH)
        if (bg) {
          ctx.fillStyle = bg
          ctx.fillRect(0, 0, stageW, stageH)
        }
        const sc = Math.min(stageW, stageH) / STAGE
        ctx.translate((stageW - STAGE * sc) / 2, (stageH - STAGE * sc) / 2)
        ctx.scale(sc, sc)
        drawRef.current(ctx, tRef.current, loopSec)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [canvasRef])

  const step = useCallback(
    (dir: 1 | -1) => {
      const { loopSec, fps } = useLoopSettings.getState()
      setPlaying(false)
      tRef.current = wrap(tRef.current + dir / fps, loopSec)
    },
    [setPlaying],
  )

  /** 처음(t=0)부터 정확히 한 루프만 실시간으로 재생하며 녹화 → WebM 다운로드 */
  const record = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || recording) return
    const { loopSec, fps } = useLoopSettings.getState()
    tRef.current = 0
    setPlaying(true)
    setRecording(true)
    try {
      const blob = await recordCanvas(canvas, loopSec * 1000, fps)
      downloadBlob(blob, '움짤.webm')
    } catch (e) {
      alert(e instanceof Error ? e.message : '녹화에 실패했어요.')
    } finally {
      setRecording(false)
    }
  }, [canvasRef, recording, setPlaying])

  return {
    playing,
    recording,
    togglePlay: () => setPlaying(!playingRef.current),
    step,
    record: () => void record(),
    getTime: () => tRef.current,
  }
}
