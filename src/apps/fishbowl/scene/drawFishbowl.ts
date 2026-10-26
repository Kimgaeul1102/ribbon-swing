import { TAU, isBlinking } from '../../../shared/loop/curves'
import type { CharacterData } from '../../../shared/character/types'
import { drawCharacter, resolveParts } from '../../../shared/character/drawCharacter'
import type { FishbowlConfig } from '../config'
import { BOWL, drawBowlBack, drawBowlFront } from './drawBowl'
import { bob, bubbleProgress, makeBubbles, tilt } from './motion'

const CHAR_H = 330
const CHAR_CX = BOWL.cx
const CHAR_CY = 350

/** 어항 장면 한 프레임. 그리는 순서: 물/모래/수초 → 캐릭터 → 거품 → 유리 */
export function drawFishbowl(ctx: CanvasRenderingContext2D, t: number, loop: number, cfg: FishbowlConfig, character: CharacterData | undefined) {
  const u = t / loop
  const res = resolveParts(character)

  drawBowlBack(ctx, u, cfg.waterColor)

  // 몸 전체: 위아래 부유 + 좌우 기울기(90° 위상차)
  const dy = bob(t, loop, cfg.bobAmp)
  const rot = tilt(t, loop, cfg.tiltDeg)
  ctx.save()
  ctx.translate(CHAR_CX, CHAR_CY + dy)
  ctx.rotate((rot * Math.PI) / 180)
  // 머리카락: 몸보다 hairLag초 늦게, 진폭 1.5배. 몸 안에서 움직이므로 몸의 움직임을 뺀 차이만 줌. 기준점은 정수리
  const hairTilt = 1.5 * tilt(t - cfg.hairLag, loop, cfg.tiltDeg)
  const hairBob = 1.5 * bob(t - cfg.hairLag, loop, cfg.bobAmp)
  drawCharacter(
    ctx,
    res,
    { cx: 0, cy: 0, height: CHAR_H },
    {
      eyes: isBlinking(t, loop, cfg.blinkAt * loop) ? 'closed' : 'open',
      motion: { hair: { rot: hairTilt - rot, dy: hairBob - dy, px: 0.5, py: 0.18 } },
      // 사용자가 추가한 흔들림 레이어는 몸의 부유/기울기를 늦게, 더 크게 따라감
      anim: { t, loop, drive: (tt) => ({ rot: tilt(tt, loop, cfg.tiltDeg), dx: 0, dy: bob(tt, loop, cfg.bobAmp) }) },
    },
  )
  ctx.restore()

  // 입에서 올라오는 거품: 루프당 bubbleCount개, 수면에 닿으면 사라짐
  const mouthX = CHAR_CX
  const mouthY = CHAR_CY - CHAR_H / 2 + cfg.mouthY * CHAR_H
  for (const b of makeBubbles(cfg.bubbleCount, cfg.seed)) {
    const p = bubbleProgress(b, u)
    if (p === null) continue
    const startY = mouthY + bob((b.phase * loop) % loop, loop, cfg.bobAmp)
    const y = startY + (BOWL.surface + 6 - startY) * p
    const x = mouthX + b.wobbleAmp * Math.sin(TAU * p * 2 + b.wobblePhase)
    ctx.beginPath()
    ctx.arc(x, y, b.size, 0, TAU)
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x - b.size * 0.3, y - b.size * 0.3, b.size * 0.22, 0, TAU)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fill()
  }

  drawBowlFront(ctx)
}
