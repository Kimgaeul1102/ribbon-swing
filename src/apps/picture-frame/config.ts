/** 액자 설정 (new.md 5번의 CONFIG.frame) */
export type FrameStyle = 'gold' | 'wood' | 'white'

export type FrameConfig = {
  style: FrameStyle
  /** 액자 안쪽(캔버스 질감) 배경색 */
  bgColor: string
  rippleColor: string
  /** 두드리는 시각(초, 루프 안). 한 번 두드릴 때마다 톡톡 2연타 */
  knockTimes: number[]
  charHeight: number
  /** 파문이 생기는 위치(액자 안쪽 영역 비율) */
  rippleX: number
  rippleY: number
}

export const DEFAULT_FRAME: FrameConfig = {
  style: 'gold',
  bgColor: '#e9dcc3',
  rippleColor: '#ffffff',
  knockTimes: [0.6, 1.8],
  charHeight: 330,
  rippleX: 0.5,
  rippleY: 0.62,
}

export const FRAME_STYLES: { value: FrameStyle; label: string }[] = [
  { value: 'gold', label: '금색' },
  { value: 'wood', label: '나무' },
  { value: 'white', label: '흰색' },
]
