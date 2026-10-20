export type Size = { w: number; h: number }
export type Box = { x: number; y: number; w: number; h: number }

const ALPHA_THRESHOLD = 8 // 이 값 이하의 거의 투명한 픽셀은 여백으로 취급
const MAX_SCAN = 2048 // 큰 이미지는 이 크기로 줄여서 검사 (속도/메모리)

/** RGBA 픽셀 데이터에서 불투명 픽셀이 있는 영역. 전부 투명하면 null */
export function findOpaqueBounds(data: Uint8ClampedArray, w: number, h: number): Box | null {
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > ALPHA_THRESHOLD) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

/** 이미지의 원본 크기와 내용이 있는 영역(bbox, 원본 픽셀 좌표). 전부 투명하면 bbox는 전체 */
export async function measureImage(blob: Blob): Promise<{ canvas: Size; bbox: Box }> {
  const bmp = await createImageBitmap(blob)
  const canvas = { w: bmp.width, h: bmp.height }
  const scale = Math.min(1, MAX_SCAN / Math.max(canvas.w, canvas.h))
  const w = Math.max(1, Math.round(canvas.w * scale))
  const h = Math.max(1, Math.round(canvas.h * scale))
  const el = document.createElement('canvas')
  el.width = w
  el.height = h
  const ctx = el.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('canvas 2d를 사용할 수 없습니다')
  ctx.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  const found = findOpaqueBounds(ctx.getImageData(0, 0, w, h).data, w, h)
  if (!found) return { canvas, bbox: { x: 0, y: 0, w: canvas.w, h: canvas.h } }

  // 축소해서 검사했으면 원본 좌표로 되돌림 (여유 있게 바깥쪽으로 반올림)
  const x = Math.max(0, Math.floor(found.x / scale))
  const y = Math.max(0, Math.floor(found.y / scale))
  const right = Math.min(canvas.w, Math.ceil((found.x + found.w) / scale))
  const bottom = Math.min(canvas.h, Math.ceil((found.y + found.h) / scale))
  return { canvas, bbox: { x, y, w: right - x, h: bottom - y } }
}
