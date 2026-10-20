import type { Layer } from '../store/useSwingStore'
import type { Box } from './trim'

/**
 * 한 캐릭터의 "프레임" — 레이어들의 내용 영역(bbox) 합집합만 화면에 맞추고 투명 여백은 자른다.
 * 레이어마다 따로 자르면 서로 어긋나므로 파일은 그대로 두고 프레임 위치만 옮긴다.
 * pivot은 프레임(잘린 영역) 기준 비율이라, 위쪽 중앙(0.5, 0)이 항상 리본이 묶인 지점이다.
 */
export type Frame = {
  aspect: number // 프레임 가로/세로
  scale: number // 프레임 너비 / 레이어 캔버스 너비 (자르지 않으면 1)
  /** 프레임 대비 레이어 이미지 위치·크기 (%) */
  rect: (l: Layer) => { left: number; top: number; width: number; height: number }
  /** 레이어 이미지 자체 기준 pivot 비율 (transform-origin용) */
  localPivot: (l: Layer) => { x: number; y: number }
}

function unionBox(layers: Layer[]): Box | null {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const { bbox: b } of layers) {
    if (b.w <= 0 || b.h <= 0) continue
    x0 = Math.min(x0, b.x)
    y0 = Math.min(y0, b.y)
    x1 = Math.max(x1, b.x + b.w)
    y1 = Math.max(y1, b.y + b.h)
  }
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null
}

/** layers: 한 캐릭터의 전체 레이어(숨긴 것 포함 — 체크를 껐다 켜도 위치가 안 바뀌도록) */
export function layoutFor(layers: Layer[], trim: boolean): Frame {
  const ref = layers[0]?.canvas
  // 캔버스 크기가 서로 다르면 어긋나므로 자르지 않고 예전처럼 전체를 맞춘다
  const sameCanvas = !!ref && layers.every((l) => l.canvas.w === ref.w && l.canvas.h === ref.h)
  const union = trim && sameCanvas ? unionBox(layers) : null

  if (!ref || !union) {
    const full = { left: 0, top: 0, width: 100, height: 100 }
    return { aspect: ref ? ref.w / ref.h : 1, scale: 1, rect: () => full, localPivot: (l) => l.pivot }
  }
  return {
    aspect: union.w / union.h,
    scale: union.w / ref.w,
    rect: () => ({
      left: -(union.x / union.w) * 100,
      top: -(union.y / union.h) * 100,
      width: (ref.w / union.w) * 100,
      height: (ref.h / union.h) * 100,
    }),
    localPivot: (l) => ({
      x: (union.x + l.pivot.x * union.w) / ref.w,
      y: (union.y + l.pivot.y * union.h) / ref.h,
    }),
  }
}
