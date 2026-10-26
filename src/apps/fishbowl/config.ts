/** 어항 설정 (new.md 1번의 CONFIG.fishbowl) */
export type FishbowlConfig = {
  waterColor: string
  /** 루프당 거품 개수 (3~5) */
  bubbleCount: number
  /** 머리카락이 몸보다 늦게 따라오는 시간(초) */
  hairLag: number
  /** 위아래 부유 폭(px) */
  bobAmp: number
  /** 좌우 기울기(도) */
  tiltDeg: number
  /** 눈 깜빡임 시점(루프 비율 0~1) */
  blinkAt: number
  /** 거품이 나오는 입 위치 (캐릭터 높이 비율, 위=0) */
  mouthY: number
  seed: number
}

export const DEFAULT_FISHBOWL: FishbowlConfig = {
  waterColor: '#7dd3fc',
  bubbleCount: 4,
  hairLag: 0.3,
  bobAmp: 12,
  tiltDeg: 4,
  blinkAt: 0.62,
  mouthY: 0.4,
  seed: 5,
}
