import { isBlinking } from '../../../shared/loop/curves'
import type { CharacterData } from '../../../shared/character/types'
import { drawCharacter, resolveParts } from '../../../shared/character/drawCharacter'
import type { PoliceConfig } from '../config'
import { WINDOW, drawCabin, drawCuffs, drawMesh, drawSeatBack, drawWindowScene } from './drawInterior'
import { carShake, headTurn, lightPhase, sighScale } from './motion'

/** 경찰차 장면 한 프레임: 차 안 → 창밖 → 좌석 → 캐릭터 → 수갑 → 철망 → 경광등 색 */
export function drawPoliceCar(ctx: CanvasRenderingContext2D, t: number, loop: number, cfg: PoliceConfig, character: CharacterData | undefined) {
  const res = resolveParts(character)

  drawCabin(ctx)
  drawWindowScene(ctx, t, loop, cfg.cityColor)
  drawSeatBack(ctx)

  // 캐릭터: 차 진동으로 1px 흔들림 / 고개(머리·머리카락·눈·입)는 목을 기준으로 -6° / 한숨엔 몸이 세로로 오르내림
  const shake = carShake(t, loop)
  const turn = headTurn(t, loop, cfg.turnAt)
  const neck = { rot: turn, px: 0.5, py: cfg.neckY }
  ctx.save()
  ctx.translate(shake * 0.6, shake)
  drawCharacter(
    ctx,
    res,
    { cx: 300, cy: 600 - cfg.charHeight / 2 + 10, height: cfg.charHeight },
    {
      eyes: isBlinking(t, loop, cfg.blinkAt * loop) ? 'closed' : 'open',
      motion: {
        body: { sy: sighScale(t, loop, cfg.sighAt), px: 0.5, py: 1 },
        head: neck,
        hair: neck,
        eyes: neck,
        mouth: neck,
      },
      skip: ['hand_l', 'hand_r'],
      // 흔들림 레이어: 차 진동을 늦게 따라감
      anim: { t, loop, drive: (tt) => ({ rot: 0, dx: carShake(tt, loop) * 0.6, dy: carShake(tt, loop) }) },
    },
  )
  drawCuffs(ctx, cfg.cuffsX, cfg.cuffsY + shake)
  ctx.restore()

  if (cfg.showMesh) drawMesh(ctx)

  // 경광등: 빨강/파랑이 번갈아 캐릭터·좌석·창에 비침. 창쪽엔 빛이 더 강하게
  const red = lightPhase(t, loop, cfg.lightSpeed) < 0.5
  const tint = red ? '255,40,60' : '50,100,255'
  ctx.fillStyle = `rgba(${tint},0.16)`
  ctx.fillRect(0, 0, 600, 600)
  const glow = ctx.createRadialGradient(WINDOW.x + WINDOW.w, WINDOW.y, 10, WINDOW.x + WINDOW.w, WINDOW.y, 420)
  glow.addColorStop(0, `rgba(${tint},0.35)`)
  glow.addColorStop(1, `rgba(${tint},0)`)
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 600, 600)
}
