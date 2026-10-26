import type { ShelfConfig } from '../config'

export type JarSlot = { index: number; x: number; boardY: number; w: number; h: number }

/** 선반 판자 y 위치 */
export const boardYs = (rows: 1 | 2) => (rows === 1 ? [470] : [300, 560])

/** 캐릭터 수만큼 병 자리를 계산: 단마다 비슷한 개수로 나누고 간격은 자동 */
export function layoutJars(count: number, rows: ShelfConfig['rows']): JarSlot[] {
  const r = Math.min(rows, Math.max(1, count)) as 1 | 2
  const perRow = Math.ceil(count / r)
  const ys = boardYs(r)
  const maxW = r === 1 ? 190 : 150
  const w = Math.min(maxW, 520 / perRow - 12)
  const h = Math.min(w * 1.45, r === 1 ? 330 : 215)
  const slots: JarSlot[] = []
  for (let row = 0; row < r; row++) {
    const start = row * perRow
    const n = Math.min(perRow, count - start)
    if (n <= 0) break
    const spacing = Math.min(560 / n, w + 30)
    for (let j = 0; j < n; j++) {
      slots.push({ index: start + j, x: 300 + (j - (n - 1) / 2) * spacing, boardY: ys[row], w, h })
    }
  }
  return slots
}
