/** 트랙 요소 (new.md 6번 명세). 좌표는 월드 px, angle은 도(deg, 시계 방향 +) */
export type TrackItem =
  | { type: 'ramp'; x: number; y: number; w: number; angle: number }
  | { type: 'wall'; x: number; y: number; w: number; h: number }
  | { type: 'funnel'; x: number; y: number; w: number; gap: number }
  | { type: 'bumper'; x: number; y: number; r: number; restitution: number }
  | { type: 'seesaw'; x: number; y: number; w: number }
  | { type: 'spinner'; x: number; y: number; size: number; speed: number }
  | { type: 'goal'; x: number; y: number; w: number; h: number }

export type Rect = { x: number; y: number; w: number; h: number }

export type PresetId = 'solo' | 'zigzag' | 'pinball' | 'gauntlet'

/** 트랙 프리셋: 월드 높이 + 구슬이 시작할 영역 + 트랙 요소 */
export type TrackPreset = {
  id: PresetId
  label: string
  worldH: number
  start: Rect
  track: TrackItem[]
}

/** 레이스에 나오는 캐릭터. src가 없으면 색 구슬로 그림 */
export type Character = {
  id: string
  name: string
  color: string
  src?: string
}

/** 물리/모양 설정 (CONFIG.marble) */
export type MarbleParams = {
  radius: number
  restitution: number
  friction: number
  frictionAir: number
  density: number
  rotateSprite: boolean
}

/** 시뮬레이션을 만들 때 필요한 값 전부 */
export type SimConfig = {
  preset: TrackPreset
  characters: Character[]
  marble: MarbleParams
  seed: number
  gravity: number
  timeoutSec: number
}

export const WORLD_W = 600
