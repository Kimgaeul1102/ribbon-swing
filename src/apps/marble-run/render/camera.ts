import type { MarbleSim } from '../sim/marbleSim'
import { WORLD_W } from '../types'

/** 화면(캔버스) 논리 크기. 실제 해상도는 2배로 그림 */
export const VIEW_W = 600
export const VIEW_H = 800

export type Camera = { scale: number; offsetX: number; offsetY: number }

/** 따라가기 켜면: 선두 구슬이 화면 위쪽 40% 지점에 오도록 세로 스크롤. 끄면 월드 전체가 한 화면에 들어오게 축소 */
export function targetCamera(sim: MarbleSim, follow: boolean): Camera {
  const worldH = sim.config.preset.worldH
  if (!follow || worldH <= VIEW_H) {
    const scale = Math.min(VIEW_W / WORLD_W, VIEW_H / worldH)
    return { scale, offsetX: (VIEW_W - WORLD_W * scale) / 2, offsetY: (VIEW_H - worldH * scale) / 2 }
  }
  const racing = sim.marbles.filter((m) => m.finishTime === null)
  const pool = racing.length > 0 ? racing : sim.marbles
  const leaderY = Math.max(...pool.map((m) => m.body.position.y))
  const y = Math.min(Math.max(leaderY - VIEW_H * 0.4, 0), worldH - VIEW_H)
  return { scale: 1, offsetX: 0, offsetY: -y }
}

/** 카메라가 갑자기 튀지 않게 부드럽게 따라감 (화면에만 영향, 물리 결과와 무관) */
export function easeCamera(cur: Camera, target: Camera, k = 0.15): Camera {
  return {
    scale: cur.scale + (target.scale - cur.scale) * k,
    offsetX: cur.offsetX + (target.offsetX - cur.offsetX) * k,
    offsetY: cur.offsetY + (target.offsetY - cur.offsetY) * k,
  }
}
