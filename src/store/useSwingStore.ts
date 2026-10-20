import { create } from 'zustand'
import { newId } from '../utils/id'

export type Character = {
  id: string
  name: string
  swingStartedAt: number // 이 캐릭터의 진자 t=0 시각 (performance.now, ms)
  reactedAt: number // 마지막으로 "밀기"를 받은 시각 (표정 변화/뿅뿅 효과 기준, 0이면 없음)
}

/** 레이어 표시 조건: 항상 / 평소에만 / 밀렸을 때만 (표정 교체용) */
export type Expression = 'always' | 'normal' | 'hit'

export type Layer = {
  id: string
  characterId: string // 어느 캐릭터(인원)에 속한 레이어인지
  expression: Expression
  assetId: string // 보관함 이미지 id — 같은 이미지를 여러 번/여러 세트에서 재사용
  name: string // "body", "hair", "tie" ...
  src: string // object URL
  zIndex: number
  pivot: { x: number; y: number } // 0~1 비율, 회전 기준점
  delay: number // 메인보다 몇 ms 늦게 반응 (0~300)
  amplitudeMul: number // 메인 진폭 배율 (0.5~2.0)
  stiffness: number // 스프링 강성 (0.05~0.5) — 낮을수록 흐물흐물
  enabled: boolean
}

type SwingState = {
  amplitude: number // 세기 (deg, 0~45)
  frequency: number // 속도 (Hz, 0.2~2.0)
  damping: number // 감쇠 (0~1)
  wobble: number // 꿀렁임 (0~1)
  sway: number // 아래로 갈수록 더 흔들림 (0~1)
  spacing: number // 인원 간 간격 (0.2~1, 1이면 무대를 균등 분할)
  pushGap: number // "차례대로 밀기"에서 인원 사이 간격 (초)
  reactionSec: number // 밀린 표정을 유지하는 시간 (초)
  popEffect: boolean // 뿅뿅 효과 on/off
  characters: Character[]
  activeCharacterId: string // 레이어 편집 대상
  layers: Layer[]
  setParam: (key: 'amplitude' | 'frequency' | 'damping' | 'wobble' | 'sway' | 'spacing' | 'pushGap' | 'reactionSec', value: number) => void
  pushAll: () => void
  pushSequential: () => void
  setPopEffect: (on: boolean) => void
  kickCharacter: (id: string) => void
  addCharacter: () => void
  removeCharacter: (id: string) => void
  renameCharacter: (id: string, name: string) => void
  setActiveCharacter: (id: string) => void
  addLayer: (layer: Layer) => void
  updateLayer: (id: string, patch: Partial<Layer>) => void
  removeLayer: (id: string) => void
  moveLayer: (id: string, dir: 'up' | 'down') => void
}

const first: Character = { id: newId(), name: '캐릭터 1', swingStartedAt: performance.now(), reactedAt: 0 }

export const useSwingStore = create<SwingState>((set) => ({
  amplitude: 20,
  frequency: 0.8,
  damping: 0.2,
  wobble: 0.5,
  sway: 0.5,
  spacing: 1,
  pushGap: 0.3,
  reactionSec: 1.2,
  popEffect: true,
  characters: [first],
  activeCharacterId: first.id,
  layers: [],
  setParam: (key, value) => set({ [key]: value }),
  // 한번에: 모든 인원이 동시에 / 차례대로: 1번, 2번, 3번… pushGap초 간격으로
  pushAll: () =>
    set((s) => {
      const now = performance.now()
      return { characters: s.characters.map((c) => ({ ...c, swingStartedAt: now, reactedAt: now })) }
    }),
  pushSequential: () =>
    set((s) => {
      const now = performance.now()
      return {
        characters: s.characters.map((c, i) => {
          const at = now + i * s.pushGap * 1000
          return { ...c, swingStartedAt: at, reactedAt: at }
        }),
      }
    }),
  setPopEffect: (on) => set({ popEffect: on }),
  kickCharacter: (id) =>
    set((s) => ({
      characters: s.characters.map((c) => (c.id === id ? { ...c, swingStartedAt: performance.now() } : c)),
    })),
  addCharacter: () =>
    set((s) => {
      const c: Character = { id: newId(), name: `캐릭터 ${s.characters.length + 1}`, swingStartedAt: performance.now(), reactedAt: 0 }
      return { characters: [...s.characters, c], activeCharacterId: c.id }
    }),
  // 마지막 한 명은 지울 수 없음. 소속 레이어도 함께 제거
  removeCharacter: (id) =>
    set((s) => {
      if (s.characters.length <= 1) return s
      const characters = s.characters.filter((c) => c.id !== id)
      return {
        characters,
        layers: s.layers.filter((l) => l.characterId !== id),
        activeCharacterId: s.activeCharacterId === id ? characters[0].id : s.activeCharacterId,
      }
    }),
  renameCharacter: (id, name) =>
    set((s) => ({ characters: s.characters.map((c) => (c.id === id ? { ...c, name } : c)) })),
  setActiveCharacter: (id) => set({ activeCharacterId: id }),
  addLayer: (layer) => set((s) => ({ layers: [...s.layers, layer] })),
  updateLayer: (id, patch) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
  removeLayer: (id) => set((s) => ({ layers: s.layers.filter((l) => l.id !== id) })),
  // up = zIndex가 큰 쪽(앞쪽)으로. 같은 캐릭터의 이웃 레이어와 zIndex를 맞바꾼다
  moveLayer: (id, dir) =>
    set((s) => {
      const target = s.layers.find((l) => l.id === id)
      if (!target) return s
      const sorted = s.layers.filter((l) => l.characterId === target.characterId).sort((a, b) => a.zIndex - b.zIndex)
      const i = sorted.findIndex((l) => l.id === id)
      const j = dir === 'up' ? i + 1 : i - 1
      if (j < 0 || j >= sorted.length) return s
      const a = sorted[i]
      const b = sorted[j]
      return {
        layers: s.layers.map((l) =>
          l.id === a.id ? { ...l, zIndex: b.zIndex } : l.id === b.id ? { ...l, zIndex: a.zIndex } : l,
        ),
      }
    }),
}))
