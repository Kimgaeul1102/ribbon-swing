import { isBlinking, wrap } from '../../../shared/loop/curves'
import type { CharacterData } from '../../../shared/character/types'
import { drawCharacter, resolveParts } from '../../../shared/character/drawCharacter'
import type { ShelfConfig } from '../config'
import { LID_H, drawBoard, drawJarBack, drawJarFront, innerPath } from './drawJar'
import { layoutJars } from './layout'
import { blinkTime, breathScale, knockDx, knockGlassShake, pickKnocker } from './motion'

/** 병조림 선반 장면 한 프레임: 조명 → 판자 → 병마다 [유리 뒷면 → 캐릭터 → 유리 앞면] */
export function drawJarShelf(ctx: CanvasRenderingContext2D, t: number, loop: number, cfg: ShelfConfig, characters: CharacterData[]) {
  // 위에서 내려오는 조명
  const light = ctx.createLinearGradient(0, 0, 0, 600)
  light.addColorStop(0, 'rgba(255,248,220,0.55)')
  light.addColorStop(0.6, 'rgba(255,248,220,0.08)')
  light.addColorStop(1, 'rgba(255,248,220,0)')
  ctx.fillStyle = light
  ctx.fillRect(0, 0, 600, 600)

  const slots = layoutJars(characters.length, cfg.rows)
  const knocker = pickKnocker(characters.length, cfg.seed)

  for (const ys of new Set(slots.map((s) => s.boardY))) drawBoard(ctx, ys)

  for (const s of slots) {
    const c = characters[s.index]
    const res = resolveParts(c)
    const knocking = s.index === knocker
    const gx = knocking ? knockGlassShake(t, loop, cfg.knockAt) * Math.sin(t * 90) : 0

    ctx.save()
    ctx.translate(gx, 0)
    drawJarBack(ctx, s.x, s.boardY, s.w, s.h, cfg.jarShape)

    // 캐릭터는 병 안쪽 모양으로 잘림. 바닥을 기준으로 숨쉬듯 세로로 살짝 늘었다 줄어듦
    ctx.save()
    innerPath(ctx, s.x, s.boardY, s.w, s.h, cfg.jarShape)
    ctx.clip()
    const innerH = s.h - LID_H - 4
    const charH = innerH * 0.92
    const baseY = s.boardY - 6
    ctx.translate(s.x, baseY)
    ctx.scale(1, breathScale(t, loop, s.index))
    drawCharacter(
      ctx,
      res,
      { cx: 0, cy: -charH / 2, height: charH },
      {
        eyes: isBlinking(t, loop, blinkTime(loop, cfg.blinkAt, s.index)) ? 'closed' : 'open',
        motion: knocking ? { body: { dx: knockDx(t, loop, cfg.knockAt) }, head: { dx: knockDx(t, loop, cfg.knockAt) }, hair: { dx: knockDx(t, loop, cfg.knockAt) }, eyes: { dx: knockDx(t, loop, cfg.knockAt) }, mouth: { dx: knockDx(t, loop, cfg.knockAt) } } : undefined,
        skip: ['hand_l', 'hand_r'],
        // 흔들림 레이어도 두드릴 때 같이 움직이고(base) 늦게 따라 흔들림(drive)
        anim: knocking
          ? { t, loop, base: { dx: knockDx(t, loop, cfg.knockAt) }, drive: (tt) => ({ rot: 0, dx: knockDx(wrap(tt, loop), loop, cfg.knockAt), dy: 0 }) }
          : { t, loop },
      },
    )
    ctx.restore()

    drawJarFront(ctx, s.x, s.boardY, s.w, s.h, cfg.jarShape, c?.name ?? '', cfg.labelFont)
    ctx.restore()
  }
}
