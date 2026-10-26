/** 경찰차 설정 (new.md 4번의 CONFIG.police / cuffs) */
export type PoliceConfig = {
  /** 경광등 빠르기 배율 (1 = 빨강/파랑이 1초에 한 바퀴) */
  lightSpeed: number
  cityColor: string
  showMesh: boolean
  /** 수갑 위치(장면 600 기준 px) */
  cuffsX: number
  cuffsY: number
  charHeight: number
  /** 고개를 돌리는 시점 / 한숨 시점 / 깜빡임 시점 (루프 비율 0~1) */
  turnAt: number
  sighAt: number
  blinkAt: number
  /** 고개 회전 기준점(목) 높이: 캐릭터 높이 비율, 위=0 */
  neckY: number
}

export const DEFAULT_POLICE: PoliceConfig = {
  lightSpeed: 1,
  cityColor: '#1e293b',
  showMesh: true,
  cuffsX: 300,
  cuffsY: 470,
  charHeight: 400,
  turnAt: 0.3,
  sighAt: 0.65,
  blinkAt: 0.1,
  neckY: 0.45,
}
