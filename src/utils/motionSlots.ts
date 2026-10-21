import { newId } from './id'

/** 움직임 슬롯에 저장되는 값들 (움직임 탭의 슬라이더 + 리본 끈 흔들림). 레이어별 설정/배경/리본 그림은 포함하지 않음 */
export const MOTION_KEYS = [
  'amplitude', 'frequency', 'damping', 'wobble', 'sway', 'idleStrength', 'ribbonSwing', 'pushGap', 'reactionSec', 'popEffect',
] as const

export type MotionValues = {
  amplitude: number
  frequency: number
  damping: number
  wobble: number
  sway: number
  idleStrength: number
  ribbonSwing: number
  pushGap: number
  reactionSec: number
  popEffect: boolean
}

export type MotionSlot = { id: string; name: string; values: MotionValues; savedAt: number }

export function pickMotion(s: MotionValues): MotionValues {
  return Object.fromEntries(MOTION_KEYS.map((k) => [k, s[k]])) as MotionValues
}

export function createSlot(name: string, s: MotionValues, now = Date.now()): MotionSlot {
  return { id: newId(), name: name.trim() || '이름 없는 움직임', values: pickMotion(s), savedAt: now }
}

/** 저장소에서 읽은 값이 깨졌거나 일부 값이 빠져 있어도 앱이 죽지 않게 걸러냄 */
export function parseSlots(raw: string | null): MotionSlot[] {
  if (!raw) return []
  try {
    const list: unknown = JSON.parse(raw)
    if (!Array.isArray(list)) return []
    return list.filter(
      (x): x is MotionSlot =>
        !!x &&
        typeof x.id === 'string' &&
        typeof x.name === 'string' &&
        !!x.values &&
        MOTION_KEYS.every((k) => typeof x.values[k] === (k === 'popEffect' ? 'boolean' : 'number')),
    )
  } catch {
    return []
  }
}
