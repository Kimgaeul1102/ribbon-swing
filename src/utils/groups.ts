import type { Layer, LayerGroup } from '../store/useSwingStore'
import type { Box, Size } from './trim'

/**
 * 한 폴더(한 번에 올린 묶음)의 자를 영역: 멤버 이미지의 불투명 영역(bbox) 합집합.
 * 캔버스 크기가 서로 다르면 어긋나므로 자르지 않는다(null).
 * 폴더를 만들 때 한 번만 계산해서 고정한다 — 나중에 다른 폴더를 더하거나 레이어를 숨겨도 이미 올린 그림이 움직이지 않게.
 */
export function computeCrop(layers: Layer[]): { canvas: Size | null; crop: Box | null } {
  const ref = layers[0]?.canvas
  if (!ref || !layers.every((l) => l.canvas.w === ref.w && l.canvas.h === ref.h)) return { canvas: null, crop: null }

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
  const crop = x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null
  return { canvas: { ...ref }, crop }
}

/** 한 인원의 폴더를 앞뒤(zIndex) 순서대로 — 맨 뒤가 먼저. 레이어가 없는 폴더는 뺀다 */
export function orderedGroups(groups: LayerGroup[], layers: Layer[]): LayerGroup[] {
  const minZ = new Map<string, number>()
  for (const l of layers) minZ.set(l.groupId, Math.min(minZ.get(l.groupId) ?? Infinity, l.zIndex))
  return groups.filter((g) => minZ.has(g.id)).sort((a, b) => minZ.get(a.id)! - minZ.get(b.id)!)
}

/** 폴더를 앞(up)/뒤(down)로 한 칸 옮김. 폴더 안 레이어 순서는 그대로, zIndex는 0부터 연속 번호로 다시 매김 */
export function moveGroupInLayers(layers: Layer[], groups: LayerGroup[], groupId: string, dir: 'up' | 'down'): Layer[] {
  const group = groups.find((g) => g.id === groupId)
  if (!group) return layers
  const mine = layers.filter((l) => l.characterId === group.characterId)
  const order = orderedGroups(
    groups.filter((g) => g.characterId === group.characterId),
    mine,
  )
  const i = order.findIndex((g) => g.id === groupId)
  const j = dir === 'up' ? i + 1 : i - 1
  if (i < 0 || j < 0 || j >= order.length) return layers
  ;[order[i], order[j]] = [order[j], order[i]]

  const newZ = new Map<string, number>()
  let z = 0
  for (const g of order) {
    for (const l of mine.filter((m) => m.groupId === g.id).sort((a, b) => a.zIndex - b.zIndex)) newZ.set(l.id, z++)
  }
  return layers.map((l) => (newZ.has(l.id) ? { ...l, zIndex: newZ.get(l.id)! } : l))
}
