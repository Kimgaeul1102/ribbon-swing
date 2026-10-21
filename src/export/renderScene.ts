import type { Layer } from '../store/useSwingStore'
import type { BgFit } from '../store/useSwingStore'
import type { SimFrame } from '../sim/swingSim'
import type { Frame } from '../utils/frame'
import { characterColumn } from '../utils/layout'
import {
  FIRE_BASE_OFFSET,
  FIRE_HEIGHT_RATIO,
  FIRE_WIDTH_RATIO,
  cookFilter,
  drawFlames,
} from '../utils/fire'
import { POP_BUBBLE, POP_PARTICLES, popPose, type PopParticle } from '../utils/popParticles'

/**
 * 화면(Stage.tsx / CharacterLayer.tsx)을 canvas에 그대로 다시 그리는 렌더러.
 * 레이아웃 규칙(열 나누기, 끈 위치, 그림 박스 70%, 줌 기준점, 변형 순서)을 화면과 똑같이 따라야 한다.
 * 길이 단위는 화면의 CSS px (stageW × stageH 기준)이고, 그릴 때 출력 크기에 맞게 확대/축소한다.
 */
export type SceneSnapshot = {
  stageW: number
  stageH: number
  zoom: number
  ribbonLength: number
  ribbonWidth: number
  spacing: number
  bgColor: string
  bgFit: BgFit
  bgImage: HTMLImageElement | null
  ribbonImage: HTMLImageElement | null
  popEffect: boolean
  characters: { id: string; attachY: number; reactedAt: number }[]
  frames: Map<string, Frame> // 캐릭터별 프레임 (utils/frame.ts layoutFor)
  layersByCharacter: Map<string, Layer[]> // zIndex 오름차순(뒤 → 앞)
  images: Map<string, HTMLImageElement> // 레이어 id → 이미지
}

/** 불/익은 정도 (fire: 불꽃을 그릴지, cook: 0~1) */
export type FireFx = { fire: boolean; cook: number }

const FIGURE_HEIGHT_RATIO = 0.7 // 그림 박스 높이 = 무대 높이의 70% (Stage.tsx의 h-[70%])
const FONT = '"Noto Sans KR", ui-sans-serif, system-ui, sans-serif'

function drawBackground(ctx: CanvasRenderingContext2D, snap: SceneSnapshot): void {
  const { stageW: W, stageH: H } = snap
  ctx.fillStyle = snap.bgColor
  ctx.fillRect(0, 0, W, H)
  const img = snap.bgImage
  if (!img) return
  if (snap.bgFit === 'fill') {
    ctx.drawImage(img, 0, 0, W, H)
    return
  }
  const k = (snap.bgFit === 'cover' ? Math.max : Math.min)(W / img.naturalWidth, H / img.naturalHeight)
  const w = img.naturalWidth * k
  const h = img.naturalHeight * k
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h) // object-fit 기본 위치: 가운데
}

function drawRibbon(ctx: CanvasRenderingContext2D, snap: SceneSnapshot, colW: number): void {
  const x = colW / 2 - snap.ribbonWidth / 2
  if (snap.ribbonImage) {
    ctx.drawImage(snap.ribbonImage, x, 0, snap.ribbonWidth, snap.ribbonLength) // 세로로 늘려 채움
    return
  }
  ctx.fillStyle = '#ec4899' // 기본 분홍 끈 (둥근 모서리)
  const r = Math.min(snap.ribbonWidth, snap.ribbonLength) / 2
  ctx.beginPath()
  ctx.moveTo(x + r, 0)
  ctx.arcTo(x + snap.ribbonWidth, 0, x + snap.ribbonWidth, snap.ribbonLength, r)
  ctx.arcTo(x + snap.ribbonWidth, snap.ribbonLength, x, snap.ribbonLength, r)
  ctx.arcTo(x, snap.ribbonLength, x, 0, r)
  ctx.arcTo(x, 0, x + snap.ribbonWidth, 0, r)
  ctx.fill()
}

function drawParticle(ctx: CanvasRenderingContext2D, p: PopParticle, elapsedMs: number): void {
  const pose = popPose(elapsedMs - p.delay, p)
  if (pose.opacity <= 0) return
  ctx.save()
  ctx.globalAlpha = pose.opacity
  ctx.translate(pose.x, pose.y)
  ctx.scale(pose.scale, pose.scale)
  ctx.fillStyle = p.color
  ctx.font = `${p.bold ? 800 : 400} ${p.size * 16}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(p.glyph, 0, 0)
  ctx.restore()
}

/** 한 프레임을 그린다. nowMs는 영상 처음을 0으로 한 가상 시간 */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  snap: SceneSnapshot,
  pose: SimFrame,
  nowMs: number,
  outW: number,
  outH: number,
  fx: FireFx = { fire: false, cook: 0 },
): void {
  const { stageW: W, stageH: H } = snap
  const n = snap.characters.length
  ctx.setTransform(outW / W, 0, 0, outH / H, 0, 0)
  ctx.globalAlpha = 1
  drawBackground(ctx, snap)

  // 줌: 위쪽 중앙 기준 (배경은 줌 바깥)
  ctx.save()
  ctx.translate(W / 2, 0)
  ctx.scale(snap.zoom, snap.zoom)
  ctx.translate(-W / 2, 0)

  // 위쪽 가로대 (인원이 둘 이상일 때)
  if (n > 1) {
    const first = (characterColumn(0, n, snap.spacing).center / 100) * W
    const last = (characterColumn(n - 1, n, snap.spacing).center / 100) * W
    ctx.strokeStyle = '#f9a8d4'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(first, 3)
    ctx.lineTo(last, 3)
    ctx.stroke()
  }

  snap.characters.forEach((c, i) => {
    const col = characterColumn(i, n, snap.spacing)
    const colW = (col.width / 100) * W
    const colLeft = ((col.center - col.width / 2) / 100) * W
    const frame = snap.frames.get(c.id)
    ctx.save()
    ctx.translate(colLeft, 0)

    // 리본 끈 + 캐릭터 묶음: 위쪽 가로대(열 위쪽 가운데) 기준으로 끈 각도만큼 회전
    ctx.save()
    ctx.translate(colW / 2, 0)
    ctx.rotate(((pose.ribbon.get(c.id) ?? 0) * Math.PI) / 180)
    ctx.translate(-colW / 2, 0)
    drawRibbon(ctx, snap, colW)

    if (frame) {
      ctx.filter = cookFilter(fx.cook) // 익은 정도 (그림에만 적용, 끈은 그대로). 지원 안 하는 브라우저는 무시됨
      // 그림 박스: 끈 끝이 attachY 높이에 닿도록 위로 올림, 가로는 열 가운데
      const boxH = H * FIGURE_HEIGHT_RATIO
      const boxW = boxH * frame.aspect
      const boxX = (colW - boxW) / 2
      const boxY = snap.ribbonLength - c.attachY * boxH
      for (const layer of snap.layersByCharacter.get(c.id) ?? []) {
        const lp = pose.layers.get(layer.id)
        const img = snap.images.get(layer.id)
        if (!layer.enabled || !lp || !lp.visible || !img) continue
        const r = frame.rect(layer)
        const lx = boxX + (r.left / 100) * boxW
        const ly = boxY + (r.top / 100) * boxH
        const lw = (r.width / 100) * boxW
        const lh = (r.height / 100) * boxH
        const o = frame.localPivot(layer)
        const ox = lx + o.x * lw
        const oy = ly + o.y * lh
        // 화면과 같은 순서: rotate → skewX → scale, 기준점은 pivot
        ctx.save()
        ctx.translate(ox, oy)
        ctx.rotate((lp.rotate * Math.PI) / 180)
        ctx.transform(1, 0, Math.tan((lp.skew * Math.PI) / 180), 1, 0, 0)
        ctx.scale(lp.scaleX, lp.scaleY)
        ctx.translate(-ox, -oy)
        ctx.drawImage(img, lx, ly, lw, lh)
        ctx.restore()
      }
      ctx.filter = 'none'
    }
    ctx.restore() // 끈 회전 묶음

    // 발밑 불: 끈과 함께 회전하지 않고 정지 상태의 그림 맨 아래에 고정 (Fire.tsx와 같은 위치 규칙)
    if (fx.fire) {
      const fw = colW * FIRE_WIDTH_RATIO
      const fh = H * FIRE_HEIGHT_RATIO
      ctx.save()
      ctx.translate(
        (colW - fw) / 2,
        snap.ribbonLength + (FIRE_BASE_OFFSET + FIGURE_HEIGHT_RATIO * (1 - c.attachY) - FIRE_HEIGHT_RATIO) * H,
      )
      drawFlames(ctx, fw, fh, nowMs / 1000)
      ctx.restore()
    }

    // 뿅뿅 효과: 끈과 함께 회전하지 않고 머리 근처에 그려짐
    if (snap.popEffect && c.reactedAt > 0) {
      const elapsed = nowMs - c.reactedAt
      ctx.save()
      ctx.translate(colW / 2, snap.ribbonLength - c.attachY * H * FIGURE_HEIGHT_RATIO + H * 0.08)
      for (const p of [...POP_PARTICLES, POP_BUBBLE]) drawParticle(ctx, p, elapsed)
      ctx.restore()
    }
    ctx.restore() // 열
  })

  ctx.restore() // 줌
}
