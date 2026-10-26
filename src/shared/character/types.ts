/** 캐릭터 파츠 파일 이름 규칙 (new.md 공통 규칙). 없는 파츠는 생략 가능 */
export const PART_NAMES = ['body', 'head', 'hair', 'eyes_open', 'eyes_closed', 'mouth', 'hand_l', 'hand_r'] as const
export type PartName = (typeof PART_NAMES)[number]

export const PART_LABELS: Record<PartName, string> = {
  body: '몸',
  head: '머리',
  hair: '머리카락',
  eyes_open: '눈 뜸',
  eyes_closed: '눈 감음',
  mouth: '입',
  hand_l: '왼손',
  hand_r: '오른손',
}

/** 사용자가 이름 상관없이 추가하는 "흔들릴 부분" 레이어 (머리 묶음, 리본, 꼬리 등). 앱의 움직임을 늦게, 더 크게 따라 흔들림 */
export type ExtraLayer = {
  id: string
  name: string
  /** 이미지 주소(object URL) */
  url: string
  /** 흔들림 강도 0~3 (1 = 몸 움직임과 같은 크기로 따라옴, 클수록 크게) */
  strength: number
  /** 몸보다 늦게 따라오는 시간(초) */
  lag: number
  /** 평소 살랑거리는 속도 배율 */
  speed: number
  /** 회전 기준점(파츠 캔버스 비율, 0~1). 보통 머리카락처럼 붙은 윗부분 */
  pivotX: number
  pivotY: number
  /** true면 몸 뒤에 그림 (뒷머리 등) */
  behind: boolean
}

export type CharacterData = {
  id: string
  name: string
  /** 파츠 이름 → 이미지 주소(object URL) */
  parts: Partial<Record<PartName, string>>
  /** 흔들림 레이어 (개수 제한 없음) */
  extras: ExtraLayer[]
  /** 기본 머리카락 파츠에 더하는 추가 흔들림 강도 (0 = 없음) */
  hairSway: number
}

/** 그릴 때 쓰는 층(슬롯). 눈은 open/closed 중 지금 상태의 것을 그림. 그리는 순서 = 아래 배열 순서 */
export const SLOTS = ['body', 'head', 'hair', 'eyes', 'mouth', 'hand_l', 'hand_r'] as const
export type SlotName = (typeof SLOTS)[number]
