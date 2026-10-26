import type { MarbleSim } from '../sim/marbleSim'
import type { Camera } from './camera'
import { VIEW_H, VIEW_W } from './camera'
import { drawFinish } from './drawFinish'
import { drawMarble } from './drawMarbles'
import { drawTrack } from './drawTrack'

export type SceneOptions = {
  camera: Camera
  overlaySrc: string | null
  /** 종료 후 흐른 초 (아직 안 끝났으면 null) */
  finishT: number | null
}

/** 한 프레임 그리기. 캔버스는 2배 해상도라 논리 좌표(VIEW_W × VIEW_H)로 그리도록 먼저 scale(2) */
export function drawScene(ctx: CanvasRenderingContext2D, sim: MarbleSim, opts: SceneOptions) {
  ctx.setTransform(2, 0, 0, 2, 0, 0)
  ctx.clearRect(0, 0, VIEW_W, VIEW_H)
  ctx.fillStyle = '#fff7fb'
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)

  const { camera } = opts
  ctx.save()
  ctx.translate(camera.offsetX, camera.offsetY)
  ctx.scale(camera.scale, camera.scale)
  drawTrack(ctx, sim, opts.overlaySrc)
  const { radius, rotateSprite } = sim.config.marble
  const byId = new Map(sim.config.characters.map((c) => [c.id, c]))
  for (const m of sim.marbles) {
    const c = byId.get(m.id)
    if (c) drawMarble(ctx, c, m.body.position.x, m.body.position.y, radius, m.body.angle, rotateSprite)
  }
  ctx.restore()

  if (opts.finishT !== null) drawFinish(ctx, sim, opts.finishT)
}
