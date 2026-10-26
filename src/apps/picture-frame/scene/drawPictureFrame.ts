import { rad } from '../../../shared/loop/curves'
import type { CharacterData } from '../../../shared/character/types'
import { drawCharacter, resolveParts } from '../../../shared/character/drawCharacter'
import type { FrameConfig } from '../config'
import { INNER, NAIL, drawCanvasBg, drawFrameBorder, drawGlassReflection, drawHanging, drawRipples, innerClip } from './drawFrame'
import { frameSway, isKnocking, ripples, tapPulse } from './motion'

/**
 * 액자 장면 한 프레임. 전체가 못(NAIL)을 기준으로 흔들림.
 * 순서: 캔버스 배경 → 캐릭터 → 손(유리 바로 뒤) → 파문 → 유리 반사 → 액자 테두리(캐릭터보다 위) → 끈/못
 */
export function drawPictureFrame(ctx: CanvasRenderingContext2D, t: number, loop: number, cfg: FrameConfig, character: CharacterData | undefined) {
  const res = resolveParts(character)
  const hasHands = !!(character?.parts.hand_l || character?.parts.hand_r)
  const pulse = tapPulse(t, loop, cfg.knockTimes)

  ctx.save()
  ctx.translate(NAIL.x, NAIL.y)
  ctx.rotate(rad(frameSway(t, loop, cfg.knockTimes)))
  ctx.translate(-NAIL.x, -NAIL.y)

  drawCanvasBg(ctx, cfg.bgColor)

  ctx.save()
  innerClip(ctx)
  const place = { cx: INNER.x + INNER.w / 2, cy: INNER.y + INNER.h - cfg.charHeight / 2 + 20, height: cfg.charHeight }
  const eyes = isKnocking(t, loop, cfg.knockTimes) ? 'closed' : 'open'
  // 손이 있으면 손만 유리 쪽으로 톡 튀어나오고, 없으면 몸 전체가 좌우로 살짝 흔들림
  const handPush = { dy: -8 * pulse, sx: 1 + 0.08 * pulse, sy: 1 + 0.08 * pulse }
  const bodyShift = hasHands ? 0 : 3 * pulse
  drawCharacter(ctx, res, place, {
    eyes,
    motion: hasHands
      ? { hand_l: handPush, hand_r: handPush }
      : { body: { dx: bodyShift }, head: { dx: bodyShift }, hair: { dx: bodyShift }, eyes: { dx: bodyShift }, mouth: { dx: bodyShift } },
    skip: ['hand_l', 'hand_r'], // 손은 아래에서 유리 바로 뒤에 따로 그림
    // 흔들림 레이어: 액자가 흔들리는 걸 늦게, 더 크게 따라감
    anim: { t, loop, base: { dx: bodyShift }, drive: (tt) => ({ rot: frameSway(tt, loop, cfg.knockTimes), dx: 0, dy: 0 }) },
  })
  if (hasHands) drawCharacter(ctx, res, place, { eyes, only: ['hand_l', 'hand_r'], motion: { hand_l: handPush, hand_r: handPush } })
  ctx.restore()

  drawRipples(ctx, INNER.x + INNER.w * cfg.rippleX, INNER.y + INNER.h * cfg.rippleY, ripples(t, loop, cfg.knockTimes), cfg.rippleColor)
  drawGlassReflection(ctx)
  drawFrameBorder(ctx, cfg.style)
  drawHanging(ctx)
  ctx.restore()
}
