import { getImg } from './imageCache'
import { getPlaceholderParts, PH_H, PH_W } from './placeholder'
import { combineMotion, swayMotion, type Anim } from './sway'
import { PART_NAMES, SLOTS, type CharacterData, type ExtraLayer, type PartName, type SlotName } from './types'

export type ResolvedExtra = { layer: ExtraLayer; img: CanvasImageSource }

export type ResolvedParts = {
  images: Partial<Record<PartName, CanvasImageSource>>
  /** 아직 로딩 중인 그림은 빠져 있음 */
  extras: ResolvedExtra[]
  hairSway: number
  /** 기준 크기(캔버스 크기): 파츠들은 같은 크기의 캔버스에서 내보낸 PNG라고 가정 */
  w: number
  h: number
  placeholder: boolean
}

const dims = (img: CanvasImageSource) =>
  img instanceof HTMLImageElement ? { w: img.naturalWidth, h: img.naturalHeight } : { w: (img as HTMLCanvasElement).width, h: (img as HTMLCanvasElement).height }

/** 캐릭터의 이미지 주소들을 그릴 수 있는 이미지로 바꿈. 아무 그림도 안 올렸으면 임시 캐릭터 */
export function resolveParts(c: CharacterData | undefined): ResolvedParts {
  const urls = c?.parts ?? {}
  const names = PART_NAMES.filter((n) => urls[n])
  const extraLayers = c?.extras ?? []
  if (names.length === 0 && extraLayers.length === 0) {
    return { images: getPlaceholderParts(), extras: [], hairSway: 0, w: PH_W, h: PH_H, placeholder: true }
  }
  const images: ResolvedParts['images'] = {}
  for (const n of names) {
    const img = getImg(urls[n]!)
    if (img) images[n] = img
  }
  const extras: ResolvedExtra[] = []
  for (const layer of extraLayers) {
    const img = getImg(layer.url)
    if (img) extras.push({ layer, img })
  }
  // 크기 기준: 몸 → 머리 → 아무 파츠 → 흔들림 레이어 (파츠 없이 레이어만 올린 경우)
  const ref = images.body ?? images.head ?? Object.values(images)[0] ?? extras[0]?.img
  const size = ref ? dims(ref) : { w: 0, h: 0 }
  return { images, extras, hairSway: c?.hairSway ?? 0, w: size.w, h: size.h, placeholder: false }
}

/** 한 층의 움직임. dx/dy는 장면 px, rot는 도, px/py는 회전·확대 기준점(파츠 캔버스 비율, 기본 가운데) */
export type PartMotion = { dx?: number; dy?: number; rot?: number; sx?: number; sy?: number; px?: number; py?: number }

export type Placement = { cx: number; cy: number; height: number }

export type DrawCharacterOpts = {
  eyes?: 'open' | 'closed'
  motion?: Partial<Record<SlotName, PartMotion>>
  /** 그리지 않을 층 / 이 층만 그릴 층 */
  skip?: SlotName[]
  only?: SlotName[]
  /**
   * 시간과 몸 움직임 정보. 주면 사용자가 추가한 흔들림 레이어와 머리카락 추가 흔들림이 적용됨.
   * 안 주면 흔들림 레이어는 가만히 그려짐
   */
  anim?: Anim
}

function slotImage(res: ResolvedParts, slot: SlotName, eyes: 'open' | 'closed'): CanvasImageSource | undefined {
  if (slot === 'eyes') return eyes === 'closed' ? (res.images.eyes_closed ?? res.images.eyes_open) : res.images.eyes_open
  return res.images[slot]
}

/** 이미지 한 장을 파츠 캔버스 좌표계에서 그림 (움직임 적용). ctx는 이미 캐릭터 중심/배율로 맞춰져 있어야 함 */
function drawLayer(ctx: CanvasRenderingContext2D, img: CanvasImageSource, res: ResolvedParts, k: number, m: PartMotion | undefined) {
  const { w: iw, h: ih } = dims(img)
  const px = (m?.px ?? 0.5) * res.w
  const py = (m?.py ?? 0.5) * res.h
  ctx.save()
  ctx.translate((m?.dx ?? 0) / k, (m?.dy ?? 0) / k)
  ctx.translate(-res.w / 2 + px, -res.h / 2 + py)
  if (m?.rot) ctx.rotate((m.rot * Math.PI) / 180)
  ctx.scale(m?.sx ?? 1, m?.sy ?? 1)
  ctx.translate(-px, -py)
  ctx.drawImage(img, 0, 0, iw, ih)
  ctx.restore()
}

/**
 * 캐릭터를 place 위치(가운데 기준)에 높이 height로 그림.
 * 순서: 뒤쪽 흔들림 레이어 → body, head, hair, eyes, mouth, hand_l, hand_r → 앞쪽 흔들림 레이어
 */
export function drawCharacter(ctx: CanvasRenderingContext2D, res: ResolvedParts, place: Placement, opts: DrawCharacterOpts = {}) {
  if (res.h <= 0) return
  const k = place.height / res.h
  const eyes = opts.eyes ?? 'open'
  const anim = opts.anim
  const extraMotion = (layer: ExtraLayer) => (anim ? swayMotion(layer, anim) : undefined)
  const drawExtras = (behind: boolean) => {
    if (opts.only) return // 손만 따로 그리는 호출에선 건너뜀
    for (const { layer, img } of res.extras) if (layer.behind === behind) drawLayer(ctx, img, res, k, extraMotion(layer))
  }

  ctx.save()
  ctx.translate(place.cx, place.cy)
  ctx.scale(k, k)
  drawExtras(true)
  for (const slot of SLOTS) {
    if (opts.skip?.includes(slot)) continue
    if (opts.only && !opts.only.includes(slot)) continue
    const img = slotImage(res, slot, eyes)
    if (!img) continue
    let m = opts.motion?.[slot]
    // 머리카락 파츠에 추가 흔들림 (기본 지연 0.15초, 정수리 기준)
    if (slot === 'hair' && anim && res.hairSway > 0) {
      m = combineMotion(m, swayMotion({ strength: res.hairSway, lag: 0.15, speed: 1, pivotX: 0.5, pivotY: 0.18 }, anim))
    }
    drawLayer(ctx, img, res, k, m)
  }
  drawExtras(false)
  ctx.restore()
}
