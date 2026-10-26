/** 병조림 선반 설정 (new.md 3번의 CONFIG.shelf) */
export type ShelfConfig = {
  rows: 1 | 2
  jarShape: 'jar' | 'can'
  labelFont: string
  /** 누가 병을 두드릴지 정하는 seed */
  seed: number
  /** 두드리는 시점(루프 비율 0~1) */
  knockAt: number
  /** 깜빡임 기준 시점(루프 비율). 캐릭터마다 0.37초씩 어긋남 */
  blinkAt: number
}

export const DEFAULT_SHELF: ShelfConfig = {
  rows: 2,
  jarShape: 'jar',
  labelFont: 'sans-serif',
  seed: 7,
  knockAt: 0.55,
  blinkAt: 0.2,
}

export const LABEL_FONTS = [
  { value: 'sans-serif', label: '고딕' },
  { value: 'serif', label: '명조' },
  { value: 'cursive', label: '손글씨 느낌' },
  { value: 'monospace', label: '고정폭' },
]
