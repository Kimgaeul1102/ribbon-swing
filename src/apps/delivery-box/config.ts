/** 택배 박스 설정 (new.md 2번의 CONFIG.box, 여러 명이 차례로 지나가도록 확장) */
export type BoxConfig = {
  /** 박스 앞면이 캐릭터를 가리기 시작하는 높이(px, 장면 600 기준). 클수록 캐릭터가 더 많이 보임 */
  cutY: number
  label: string
  /** 스티커에 위의 글자 대신 캐릭터 이름을 쓸지 */
  nameOnSticker: boolean
  boxColor: string
  charHeight: number
  /** 한 캐릭터 칸 중 가운데 멈춰서 보여주는 시간 비율 (0.3~0.8). 나머지는 등장/퇴장 */
  holdRatio: number
  /** 칸 안에서 눈 깜빡이는 시점 / 좌우를 둘러보는 시점 (칸 비율 0~1) */
  blinkAt: number
  lookAt: number
}

export const DEFAULT_BOX: BoxConfig = {
  cutY: 340,
  label: '취급주의',
  nameOnSticker: false,
  boxColor: '#c8935a',
  charHeight: 380,
  holdRatio: 0.5,
  blinkAt: 0.45,
  lookAt: 0.2,
}

/** 캐릭터 한 명당 기본으로 주는 시간(초). 인원이 바뀌면 루프 길이를 인원 × 이 값으로 맞춤 */
export const SECONDS_PER_CHARACTER = 3
