import { create } from 'zustand'
import { PRESETS } from '../track/presets'
import type { Character, MarbleParams, PresetId, SimConfig } from '../types'

export const MAX_CHARACTERS = 12
const PALETTE = ['#f472b6', '#60a5fa', '#facc15', '#34d399', '#a78bfa', '#fb923c', '#f87171', '#22d3ee', '#a3e635', '#e879f9', '#94a3b8', '#fbbf24']

export const DEFAULT_MARBLE: MarbleParams = {
  radius: 14,
  restitution: 0.4,
  friction: 0.01,
  frictionAir: 0.002,
  density: 0.002,
  rotateSprite: true,
}

function defaultCharacters(): Character[] {
  return ['구슬 1', '구슬 2', '구슬 3', '구슬 4'].map((name, i) => ({ id: `c${i + 1}`, name, color: PALETTE[i] }))
}

type MarbleState = {
  characters: Character[]
  presetId: PresetId
  seed: number
  marble: MarbleParams
  gravity: number
  timeoutSec: number
  followCamera: boolean
  /** 직접 그린 트랙 그림(투명 충돌체 위에 깔림). 있으면 물리 바디는 숨김 */
  trackOverlay: string | null

  playing: boolean
  slow: boolean
  /** 값이 바뀌면 시뮬레이션을 처음부터 다시 만듦 */
  runId: number
  /** 지금까지 골인한 캐릭터 id (순위판용, 루프가 갱신) */
  finishOrder: string[]
  done: boolean
}

type MarbleActions = {
  setPreset: (id: PresetId) => void
  setSeed: (seed: number) => void
  setMarble: (patch: Partial<MarbleParams>) => void
  setGravity: (g: number) => void
  setTimeoutSec: (s: number) => void
  setFollowCamera: (on: boolean) => void
  setTrackOverlay: (src: string | null) => void
  addCharacters: (items: { name: string; src: string }[]) => void
  renameCharacter: (id: string, name: string) => void
  removeCharacter: (id: string) => void
  setPlaying: (on: boolean) => void
  setSlow: (on: boolean) => void
  restart: () => void
  setProgress: (order: string[], done: boolean) => void
}

export const useMarbleStore = create<MarbleState & MarbleActions>((set) => {
  /** 설정이 바뀌면 처음부터 다시 시작하도록 runId를 올림 */
  const reset = (patch: Partial<MarbleState>) =>
    set((s) => ({ ...patch, runId: s.runId + 1, finishOrder: [], done: false }))

  return {
    characters: defaultCharacters(),
    presetId: 'zigzag',
    seed: 1,
    marble: DEFAULT_MARBLE,
    gravity: 1,
    timeoutSec: 30,
    followCamera: true,
    trackOverlay: null,
    playing: true,
    slow: false,
    runId: 0,
    finishOrder: [],
    done: false,

    setPreset: (presetId) => reset({ presetId }),
    setSeed: (seed) => reset({ seed }),
    setMarble: (patch) => set((s) => ({ marble: { ...s.marble, ...patch }, runId: s.runId + 1, finishOrder: [], done: false })),
    setGravity: (gravity) => reset({ gravity }),
    setTimeoutSec: (timeoutSec) => reset({ timeoutSec }),
    setFollowCamera: (followCamera) => set({ followCamera }),
    setTrackOverlay: (trackOverlay) => set({ trackOverlay }),
    addCharacters: (items) =>
      set((s) => {
        const room = MAX_CHARACTERS - s.characters.length
        const added = items.slice(0, Math.max(0, room)).map((it, i) => ({
          id: `c${Date.now().toString(36)}${i}`,
          name: it.name,
          src: it.src,
          color: PALETTE[(s.characters.length + i) % PALETTE.length],
        }))
        return { characters: [...s.characters, ...added], runId: s.runId + 1, finishOrder: [], done: false }
      }),
    renameCharacter: (id, name) =>
      set((s) => ({ characters: s.characters.map((c) => (c.id === id ? { ...c, name } : c)) })),
    removeCharacter: (id) =>
      set((s) => {
        if (s.characters.length <= 1) return s
        return { characters: s.characters.filter((c) => c.id !== id), runId: s.runId + 1, finishOrder: [], done: false }
      }),
    setPlaying: (playing) => set({ playing }),
    setSlow: (slow) => set({ slow }),
    restart: () => reset({}),
    setProgress: (finishOrder, done) => set({ finishOrder, done }),
  }
})

/** 현재 설정으로 시뮬레이션 설정 만들기. 캐릭터가 1명이면 솔로 트랙으로 자동 전환 */
export function buildSimConfig(s: MarbleState): SimConfig {
  const presetId: PresetId = s.characters.length === 1 ? 'solo' : s.presetId
  return {
    preset: PRESETS[presetId],
    characters: s.characters,
    marble: s.marble,
    seed: s.seed,
    gravity: s.gravity,
    timeoutSec: s.timeoutSec,
  }
}
