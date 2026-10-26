import { isBlinking, wrap } from '../../../shared/loop/curves'
import type { CharacterData } from '../../../shared/character/types'
import { drawCharacter, resolveParts } from '../../../shared/character/drawCharacter'
import type { BoxConfig } from '../config'
import { drawBelt, drawBoxBack, drawBoxFront, drawSpeedLines } from './drawBox'
import { PATTERN_W, beltPhase, boxShake, charExtraShake, lidFlap, lookDx, slotAt, slotPose } from './motion'

const CHAR_CY = 300

/** 시간 tt의 박스 상태를 흔들림 레이어용 움직임으로 환산 (등장: 앞으로 +, 퇴장: 뒤로 -, 덜컹거림은 위아래) */
function boxDrive(tt: number, loop: number, n: number, hold: number) {
  const { p } = slotAt(tt, loop, n)
  const pose = slotPose(p, hold)
  const lean = (pose.exiting > 0 ? -1 : 1) * pose.moving * 8
  return { rot: lean, dx: 0, dy: boxShake(tt, loop) * pose.moving }
}

/**
 * 택배 박스 장면 한 프레임.
 * 루프를 캐릭터 수만큼 나눠서, 칸마다 [박스가 왼쪽에서 들어옴 → 잠깐 머묾 → 컨베이어로 슝 빠져나감].
 * 1명이면 같은 캐릭터가 계속 등장. 벨트 → [박스 뒷면 → 캐릭터 → 박스 앞면]이 함께 움직임
 */
export function drawDeliveryBox(ctx: CanvasRenderingContext2D, t: number, loop: number, cfg: BoxConfig, characters: CharacterData[]) {
  const n = Math.max(1, characters.length)
  const { index, p, local, slot } = slotAt(t, loop, n)
  const character = characters[index]
  const pose = slotPose(p, cfg.holdRatio)
  const res = resolveParts(character)

  // 벨트는 박스와 같은 거리만큼 오른쪽으로 흘러야 박스가 미끄러져 보이지 않음
  drawBelt(ctx, beltPhase(index, pose.belt), PATTERN_W)

  // 움직이는 동안만 덜컹거림(멈춰 있으면 가만히)
  const dy = boxShake(t, loop) * pose.moving
  ctx.save()
  ctx.translate(pose.x, dy)
  drawSpeedLines(ctx, cfg.cutY, pose.exiting * pose.moving)
  drawBoxBack(ctx, cfg.cutY, cfg.boxColor, lidFlap(t, loop) * pose.moving + 2)

  // 캐릭터는 박스보다 2px 더 튀고 0.05초 늦게 떨어짐. 머무는 동안 눈동자가 한 번 좌우로
  drawCharacter(
    ctx,
    res,
    { cx: 300, cy: CHAR_CY + charExtraShake(t, loop) * pose.moving, height: cfg.charHeight },
    {
      eyes: isBlinking(local, slot, cfg.blinkAt * slot) ? 'closed' : 'open',
      motion: { eyes: { dx: lookDx(local, slot, cfg.lookAt) } },
      skip: ['hand_l', 'hand_r'], // 박스 안에서는 손이 안 보임
      // 흔들림 레이어: 들어올 때 앞으로 쏠리고 슝 나갈 때 뒤로 젖혀지며 덜컹거림을 따라감
      anim: { t, loop, drive: (tt) => boxDrive(wrap(tt, loop), loop, n, cfg.holdRatio) },
    },
  )

  drawBoxFront(ctx, cfg.cutY, cfg.boxColor, cfg.nameOnSticker ? (character?.name ?? '') : cfg.label)
  ctx.restore()
}
