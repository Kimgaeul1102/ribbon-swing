import type { MarbleSim } from '../sim/marbleSim'
import { makeConfettiSeeds, confettiAt } from './confetti'
import { drawMarble } from './drawMarbles'
import { VIEW_H, VIEW_W } from './camera'

const easeOutBack = (t: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/** 종료 연출: 화면을 어둡게 + 1등 확대 + 색종이 (화면 좌표계에서 그림). t = 종료 후 흐른 초 */
export function drawFinish(ctx: CanvasRenderingContext2D, sim: MarbleSim, t: number) {
  const winnerId = sim.order[0]
  const winner = sim.marbles.find((m) => m.id === winnerId)
  const char = sim.config.characters.find((c) => c.id === winnerId)

  ctx.fillStyle = `rgba(0,0,0,${Math.min(t / 0.4, 1) * 0.55})`
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)

  if (!winner || !char) {
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 32px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('시간 종료!', VIEW_W / 2, VIEW_H / 2)
    return
  }

  const grow = easeOutBack(Math.min(t / 0.6, 1))
  const r = sim.config.marble.radius * 7 * grow
  drawMarble(ctx, char, VIEW_W / 2, VIEW_H / 2 - 20, Math.max(r, 0.1), 0, false)

  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.font = 'bold 36px sans-serif'
  ctx.fillText(`🏆 ${char.name}`, VIEW_W / 2, VIEW_H / 2 + sim.config.marble.radius * 7 + 30)
  ctx.font = '18px sans-serif'
  ctx.fillText(`${winner.finishTime?.toFixed(2)}초`, VIEW_W / 2, VIEW_H / 2 + sim.config.marble.radius * 7 + 60)

  for (const p of confettiAt(makeConfettiSeeds(sim.config.seed, 80, VIEW_W), t)) {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.spin)
    ctx.fillStyle = p.color
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
    ctx.restore()
  }
}
