import type { Layer, LayerGroup } from '../store/useSwingStore'

/**
 * 한 캐릭터의 "프레임" — 맨 처음 올린 폴더(기준 폴더)의 자른 영역만 화면에 맞추고 투명 여백은 자른다.
 * 파일은 안 자르고 프레임 위치만 옮기므로 폴더 안/폴더끼리 레이어가 어긋나지 않는다.
 * 프레임은 기준 폴더로 고정돼서 다른 폴더를 더하거나 지워도 이미 올린 그림이 움직이거나 커지지 않는다.
 * pivot은 프레임(잘린 영역) 기준 비율이라, 위쪽 중앙(0.5, 0)이 정수리, y를 키우면 목·몸 쪽이다.
 */
export type Frame = {
  aspect: number // 프레임 가로/세로
  /** 프레임 대비 레이어 이미지 위치·크기 (%) */
  rect: (l: Layer) => { left: number; top: number; width: number; height: number }
  /** 레이어 이미지 자체 기준 pivot 비율 (transform-origin용) */
  localPivot: (l: Layer) => { x: number; y: number }
}

const FULL = { left: 0, top: 0, width: 100, height: 100 }

/** groups/layers: 한 캐릭터의 전체 폴더와 레이어(숨긴 것 포함) */
export function layoutFor(groups: LayerGroup[], layers: Layer[], trim: boolean): Frame {
  const base = [...groups].sort((a, b) => a.createdAt - b.createdAt).find((g) => layers.some((l) => l.groupId === g.id))
  if (!base) return { aspect: 1, rect: () => FULL, localPivot: (l) => l.pivot }

  const baseLayer = layers.find((l) => l.groupId === base.id)!
  const baseBox = trim && base.crop ? base.crop : base.canvas ? { x: 0, y: 0, ...base.canvas } : null
  if (!baseBox) {
    // 기준 폴더의 캔버스 크기가 제각각이면 자를 수 없어서 예전처럼 레이어마다 전체를 맞춘다
    return {
      aspect: baseLayer.canvas.w / baseLayer.canvas.h,
      rect: () => FULL,
      localPivot: (l) => l.pivot,
    }
  }

  // 프레임 높이를 1, 너비를 aspect로 둔 단위계에서 각 레이어 이미지의 위치/크기를 구함
  const aspect = baseBox.w / baseBox.h
  const groupOf = new Map(groups.map((g) => [g.id, g]))
  const place = (l: Layer) => {
    const g = groupOf.get(l.groupId)
    const sameCanvas = !!g?.canvas && !!base.canvas && g.canvas.w === base.canvas.w && g.canvas.h === base.canvas.h
    if (sameCanvas) {
      // 같은 캔버스 크기면 원본 위치 그대로 (기준 폴더 위에 겹쳐 입혀짐)
      const k = 1 / baseBox.h
      return { x: -baseBox.x * k, y: -baseBox.y * k, w: l.canvas.w * k, h: l.canvas.h * k }
    }
    // 크기가 다른 폴더는 자기 자른 영역을 프레임 높이에 맞추고 가로 가운데 정렬
    const own = trim && g?.crop ? g.crop : { x: 0, y: 0, w: l.canvas.w, h: l.canvas.h }
    const k = 1 / own.h
    return { x: -own.x * k + (aspect - own.w * k) / 2, y: -own.y * k, w: l.canvas.w * k, h: l.canvas.h * k }
  }

  return {
    aspect,
    rect: (l) => {
      const p = place(l)
      return { left: (p.x / aspect) * 100, top: p.y * 100, width: (p.w / aspect) * 100, height: p.h * 100 }
    },
    localPivot: (l) => {
      const p = place(l)
      return { x: (l.pivot.x * aspect - p.x) / p.w, y: (l.pivot.y - p.y) / p.h }
    },
  }
}
