import { create } from 'zustand'

/** 모든 움짤 앱이 같이 쓰는 재생/출력 설정 (루프 길이, 캔버스 크기, 배경) */
type LoopSettings = {
  loopSec: number
  fps: number
  stageW: number
  stageH: number
  /** null이면 투명 배경 */
  bg: string | null
  setLoopSec: (v: number) => void
  setStageSize: (w: number, h: number) => void
  setBg: (v: string | null) => void
}

export const useLoopSettings = create<LoopSettings>((set) => ({
  loopSec: 3,
  fps: 30,
  stageW: 600,
  stageH: 600,
  bg: null,
  setLoopSec: (loopSec) => set({ loopSec }),
  setStageSize: (stageW, stageH) => set({ stageW, stageH }),
  setBg: (bg) => set({ bg }),
}))

/** 테마 장면은 항상 이 정사각 좌표(600×600)로 그리고, 실제 캔버스 크기에 맞춰 가운데 정렬 + 확대/축소 */
export const STAGE = 600
