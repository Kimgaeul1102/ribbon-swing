import { WORLD_W, type PresetId, type TrackItem, type TrackPreset } from '../types'

const W = WORLD_W

/** 지그재그: 번갈아 기울어진 바닥판. 짝수 단은 왼쪽→오른쪽으로 내려가고 오른쪽 끝이 뚫려 있음 */
function zigzag(startY: number, tiers: number, gapY: number): TrackItem[] {
  const items: TrackItem[] = []
  for (let i = 0; i < tiers; i++) {
    const fromLeft = i % 2 === 0
    items.push({
      type: 'ramp',
      x: fromLeft ? 260 : 340,
      y: startY + i * gapY,
      w: 500,
      angle: fromLeft ? 10 : -10,
    })
  }
  return items
}

/** 핀볼 범퍼 격자 (한 줄씩 엇갈려 배치) */
function bumperGrid(y: number, cols: number, rows: number, spacingY: number): TrackItem[] {
  const items: TrackItem[] = []
  const gap = W / cols
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? gap / 2 : 0
    for (let c = 0; c < cols; c++) {
      const x = offset + c * gap
      if (x < 30 || x > W - 30) continue
      items.push({ type: 'bumper', x, y: y + r * spacingY, r: 18, restitution: 0.9 })
    }
  }
  return items
}

export const PRESETS: Record<PresetId, TrackPreset> = {
  solo: {
    id: 'solo',
    label: '솔로 (짧은 트랙)',
    worldH: 900,
    start: { x: 60, y: 40, w: 120, h: 40 },
    track: [
      { type: 'ramp', x: 260, y: 220, w: 500, angle: 10 },
      { type: 'ramp', x: 340, y: 520, w: 500, angle: -10 },
      { type: 'goal', x: W / 2, y: 840, w: W, h: 20 },
    ],
  },
  zigzag: {
    id: 'zigzag',
    label: '지그재그',
    worldH: 1600,
    start: { x: 40, y: 40, w: 220, h: 120 },
    track: [...zigzag(300, 4, 320), { type: 'goal', x: W / 2, y: 1540, w: W, h: 20 }],
  },
  pinball: {
    id: 'pinball',
    label: '핀볼',
    worldH: 1800,
    start: { x: 40, y: 40, w: W - 80, h: 120 },
    track: [
      { type: 'funnel', x: W / 2, y: 260, w: W, gap: 70 },
      ...bumperGrid(560, 6, 3, 160),
      { type: 'goal', x: W / 2, y: 1740, w: W, h: 20 },
    ],
  },
  gauntlet: {
    id: 'gauntlet',
    label: '난관 (시소+바람개비)',
    worldH: 2400,
    start: { x: 40, y: 40, w: W - 80, h: 120 },
    track: [
      { type: 'seesaw', x: 200, y: 360, w: 260 },
      { type: 'seesaw', x: 400, y: 640, w: 260 },
      { type: 'spinner', x: W / 2, y: 980, size: 220, speed: 1.4 },
      ...zigzag(1200, 3, 330),
      { type: 'goal', x: W / 2, y: 2340, w: W, h: 20 },
    ],
  },
}

export const PRESET_LIST = Object.values(PRESETS)
