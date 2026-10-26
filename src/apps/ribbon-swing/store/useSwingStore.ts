import { create } from 'zustand'
import { newId } from '../utils/id'
import type { Box, Size } from '../utils/trim'
import { DEFAULT_RIBBON_PX } from '../utils/layout'
import { moveGroupInLayers } from '../utils/groups'

export type Character = {
  id: string
  name: string
  swingStartedAt: number // 이 캐릭터가 마지막으로 밀린 시각 (performance.now, ms) — 차례대로 밀기에서는 미래일 수 있음
  attachY: number // 리본 끈이 달리는 높이 (그림 높이 비율, 0=정수리 ~ 1=맨 아래). 레이어 회전 기준점의 높이이기도 함
  reactedAt: number // 마지막으로 "밀기"를 받은 시각 (표정 변화/뿅뿅 효과 기준, 0이면 없음)
}

/**
 * 레이어 폴더 — 한 번에 올린 이미지 묶음. 같은 여백으로 함께 잘리고, 목록에서 한 덩어리로 접고 펴고 옮긴다.
 * crop(자를 영역)은 폴더를 만들 때 한 번 계산해서 고정한다.
 */
export type LayerGroup = {
  id: string
  characterId: string
  name: string
  canvas: Size | null // 멤버 이미지의 공통 캔버스 크기 (크기가 제각각이면 null)
  crop: Box | null // 멤버 불투명 영역 합집합 (원본 px 좌표). null이면 자르지 않음
  createdAt: number // 먼저 올린 폴더가 기준 폴더(프레임 기준)
  collapsed: boolean
}

/** 배경 그림 맞춤: 꽉 채우기(잘릴 수 있음) / 전체 보이기(여백 생김) / 늘려 맞추기(비율 무시) */
export type BgFit = 'cover' | 'contain' | 'fill'

/** 레이어 표시 조건: 항상 / 평소에만 / 밀렸을 때만 (표정 교체용) */
export type Expression = 'always' | 'normal' | 'hit'

export type Layer = {
  id: string
  characterId: string // 어느 캐릭터(인원)에 속한 레이어인지
  groupId: string // 어느 폴더(한 번에 올린 묶음)에 속한 레이어인지
  expression: Expression
  canvas: Size // 이미지 원본 크기 (px)
  bbox: Box // 내용이 있는 영역 (원본 px 좌표) — 투명 여백 자르기용
  assetId: string // 보관함 이미지 id — 같은 이미지를 여러 번/여러 세트에서 재사용
  name: string // "body", "hair", "tie" ...
  src: string // object URL
  zIndex: number
  pivot: { x: number; y: number } // 0~1 비율, 회전 기준점
  delay: number // 메인보다 몇 ms 늦게 반응 (0~300)
  speedMul: number // 속도 배율 (0.5~1.5) — 1보다 작으면 본체보다 천천히 흔들림
  amplitudeMul: number // 메인 진폭 배율 (0.5~2.0)
  stiffness: number // 스프링 강성 (0.05~1) — 낮을수록 흐물흐물
  waveMul: number // 말랑함 배율 (0~2) — 전체 말랑함 슬라이더에 곱해짐 (저장된 세트 호환 때문에 이름은 waveMul 유지)
  swayMul: number // 아래로 갈수록 배율 (0~2) — 전체 슬라이더에 곱해짐
  enabled: boolean
}

type SwingState = {
  amplitude: number // 세기 (deg, 0~45)
  frequency: number // 속도 (Hz, 0.2~2.0)
  damping: number // 감쇠 (0~1)
  wobble: number // 말랑함 (0~1) — 빠르게 움직일 때 세로로 늘어났다 통통 튀며 돌아옴
  sway: number // 아래로 갈수록 더 흔들림 (0~1) — 아래쪽이 더 쏠리는 기울임
  spacing: number // 인원 간 간격 (0.2~1, 1이면 무대를 균등 분할)
  pushGap: number // "차례대로 밀기"에서 인원 사이 간격 (초)
  reactionSec: number // 밀린 표정을 유지하는 시간 (초)
  popEffect: boolean // 뿅뿅 효과 on/off
  fireOn: boolean // 발밑 불 (켜져 있는 동안 캐릭터가 서서히 익음). 컨셉에는 저장하지 않음
  trim: boolean // 투명 여백 자동으로 자르기
  idleOn: boolean // 계속 흔들기 (밀지 않아도 자연스럽게 계속 흔들림)
  idleStrength: number // 계속 흔들기 세기 (deg, 0~20)
  ribbonLength: number // 리본 끈 길이 (px, 위쪽 가로대에서 캐릭터까지)
  ribbonWidth: number // 리본 끈 굵기/그림 너비 (px)
  ribbonAssetId: string | null // 리본 그림 (보관함 이미지 id). null이면 기본 분홍 끈
  bgColor: string // 배경색
  bgAssetId: string | null // 배경 그림 (보관함 이미지 id)
  bgFit: BgFit // 배경 그림 맞춤 방식
  ribbonSwing: number // 리본 끈이 흔들리는 정도 (0~1) — 캐릭터 흔들림 중 끈이 맡는 비율
  zoom: number // 화면 확대/축소 (0.5~1.5)
  stopAt: number // 마지막으로 "멈추기"를 누른 시각 (performance.now, ms)
  characters: Character[]
  activeCharacterId: string // 레이어 편집 대상
  groups: LayerGroup[]
  layers: Layer[]
  setParam: (key: 'amplitude' | 'frequency' | 'damping' | 'wobble' | 'sway' | 'spacing' | 'pushGap' | 'reactionSec' | 'idleStrength' | 'ribbonSwing' | 'ribbonLength' | 'ribbonWidth' | 'zoom', value: number) => void
  pushAll: () => void
  pushSequential: () => void
  setPopEffect: (on: boolean) => void
  setFireOn: (on: boolean) => void
  setTrim: (on: boolean) => void
  setIdleOn: (on: boolean) => void
  setRibbonAsset: (id: string | null) => void
  setBgColor: (color: string) => void
  setBgAsset: (id: string | null) => void
  setBgFit: (fit: BgFit) => void
  applyScene: (params: SceneParams, characters: Character[], groups: LayerGroup[], layers: Layer[]) => void
  stop: () => void
  kickCharacter: (id: string) => void
  addCharacter: () => void
  removeCharacter: (id: string) => void
  renameCharacter: (id: string, name: string) => void
  setActiveCharacter: (id: string) => void
  setAttachY: (id: string, y: number) => void
  addGroup: (group: LayerGroup, layers: Layer[]) => void
  replaceCharacterContent: (characterId: string, groups: LayerGroup[], layers: Layer[]) => void
  removeGroup: (id: string) => void
  moveGroup: (id: string, dir: 'up' | 'down') => void
  renameGroup: (id: string, name: string) => void
  setGroupCollapsed: (id: string, collapsed: boolean) => void
  setGroupEnabled: (id: string, enabled: boolean) => void
  removeAssetLayers: (assetId: string) => void
  updateLayer: (id: string, patch: Partial<Layer>) => void
  removeLayer: (id: string) => void
  moveLayer: (id: string, dir: 'up' | 'down') => void
}

const DEFAULT_RIBBON_WIDTH = 18 // 기본 끈은 밧줄 — 꼬임 무늬가 보이려면 어느 정도 굵어야 함
const IMAGE_RIBBON_WIDTH = 28
const DEFAULT_BG_COLOR = '#fdf2f8'

const first: Character = { id: newId(), name: '캐릭터 1', swingStartedAt: performance.now(), reactedAt: 0, attachY: 0 }

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
  fireOn: false,
  trim: true,
  idleOn: false,
  idleStrength: 6,
  ribbonLength: DEFAULT_RIBBON_PX,
  ribbonWidth: DEFAULT_RIBBON_WIDTH,
  ribbonAssetId: null,
  bgColor: DEFAULT_BG_COLOR,
  bgAssetId: null,
  bgFit: 'cover',
  ribbonSwing: 0.5,
  zoom: 1,
  stopAt: 0,
  characters: [first],
  activeCharacterId: first.id,
  groups: [],
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
  setFireOn: (on) => set({ fireOn: on }),
  setTrim: (on) => set({ trim: on }),
  setIdleOn: (on) => set({ idleOn: on }),
  // 리본 그림을 고르거나 해제하면 굵기도 어울리는 기본값으로 (그림 → 넓게, 기본 끈 → 가늘게). 이미 그림이 있을 땐 굵기 유지
  setRibbonAsset: (id) =>
    set((s) => ({
      ribbonAssetId: id,
      ribbonWidth: (s.ribbonAssetId === null) === (id === null) ? s.ribbonWidth : id ? IMAGE_RIBBON_WIDTH : DEFAULT_RIBBON_WIDTH,
    })),
  setBgColor: (color) => set({ bgColor: color }),
  setBgAsset: (id) => set({ bgAssetId: id }),
  setBgFit: (fit) => set({ bgFit: fit }),
  // 컨셉(장면) 불러오기: 설정 + 인원 + 폴더 + 레이어를 한 번에 통째로 교체
  applyScene: (params, characters, groups, layers) =>
    set({
      ...params,
      characters,
      activeCharacterId: characters[0].id,
      groups,
      layers,
    }),
  // 계속 흔들기도 끄고, 진동에 브레이크를 걸고, 예약된 밀기를 취소 (루프가 stopAt 변화를 감지)
  stop: () => set({ idleOn: false, stopAt: performance.now() }),
  kickCharacter: (id) =>
    set((s) => ({
      characters: s.characters.map((c) => (c.id === id ? { ...c, swingStartedAt: performance.now() } : c)),
    })),
  addCharacter: () =>
    set((s) => {
      const c: Character = { id: newId(), name: `캐릭터 ${s.characters.length + 1}`, swingStartedAt: performance.now(), reactedAt: 0 , attachY: 0 }
      return { characters: [...s.characters, c], activeCharacterId: c.id }
    }),
  // 마지막 한 명은 지울 수 없음. 소속 레이어도 함께 제거
  removeCharacter: (id) =>
    set((s) => {
      if (s.characters.length <= 1) return s
      const characters = s.characters.filter((c) => c.id !== id)
      return {
        characters,
        groups: s.groups.filter((g) => g.characterId !== id),
        layers: s.layers.filter((l) => l.characterId !== id),
        activeCharacterId: s.activeCharacterId === id ? characters[0].id : s.activeCharacterId,
      }
    }),
  renameCharacter: (id, name) =>
    set((s) => ({ characters: s.characters.map((c) => (c.id === id ? { ...c, name } : c)) })),
  setActiveCharacter: (id) => set({ activeCharacterId: id }),
  // 끈이 달리는 높이를 옮기면 그 인원 모든 레이어의 회전 기준점 높이도 같이 따라감 (끈 끝 = 회전 중심)
  setAttachY: (id, y) =>
    set((s) => ({
      characters: s.characters.map((c) => (c.id === id ? { ...c, attachY: y } : c)),
      layers: s.layers.map((l) => (l.characterId === id ? { ...l, pivot: { ...l.pivot, y } } : l)),
    })),
  addGroup: (group, layers) => set((s) => ({ groups: [...s.groups, group], layers: [...s.layers, ...layers] })),
  // 세트 불러오기 등: 한 인원의 폴더/레이어를 통째로 교체
  replaceCharacterContent: (characterId, groups, layers) =>
    set((s) => ({
      groups: [...s.groups.filter((g) => g.characterId !== characterId), ...groups],
      layers: [...s.layers.filter((l) => l.characterId !== characterId), ...layers],
    })),
  removeGroup: (id) =>
    set((s) => ({ groups: s.groups.filter((g) => g.id !== id), layers: s.layers.filter((l) => l.groupId !== id) })),
  // 폴더 단위로 앞뒤 순서 변경
  moveGroup: (id, dir) => set((s) => ({ layers: moveGroupInLayers(s.layers, s.groups, id, dir) })),
  renameGroup: (id, name) => set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, name } : g)) })),
  setGroupCollapsed: (id, collapsed) =>
    set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, collapsed } : g)) })),
  setGroupEnabled: (id, enabled) =>
    set((s) => ({ layers: s.layers.map((l) => (l.groupId === id ? { ...l, enabled } : l)) })),
  // 보관함에서 이미지를 지울 때: 그 이미지를 쓰는 레이어를 모두 지우고, 비어 버린 폴더도 지움
  removeAssetLayers: (assetId) =>
    set((s) => {
      const layers = s.layers.filter((l) => l.assetId !== assetId)
      return { layers, groups: s.groups.filter((g) => layers.some((l) => l.groupId === g.id)) }
    }),
  updateLayer: (id, patch) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
  // 폴더의 마지막 레이어를 지우면 폴더도 같이 지움
  removeLayer: (id) =>
    set((s) => {
      const layers = s.layers.filter((l) => l.id !== id)
      return { layers, groups: s.groups.filter((g) => layers.some((l) => l.groupId === g.id)) }
    }),
  // up = zIndex가 큰 쪽(앞쪽)으로. 같은 폴더의 이웃 레이어와 zIndex를 맞바꾼다 (폴더 안에서만 이동)
  moveLayer: (id, dir) =>
    set((s) => {
      const target = s.layers.find((l) => l.id === id)
      if (!target) return s
      const sorted = s.layers.filter((l) => l.groupId === target.groupId).sort((a, b) => a.zIndex - b.zIndex)
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

/** 컨셉(장면)에 함께 저장되는 설정 값들 */
const SCENE_PARAM_KEYS = [
  'amplitude', 'frequency', 'damping', 'wobble', 'sway', 'spacing', 'pushGap', 'reactionSec', 'popEffect', 'trim',
  'idleOn', 'idleStrength', 'ribbonLength', 'ribbonWidth', 'ribbonAssetId', 'ribbonSwing', 'zoom', 'bgColor', 'bgAssetId', 'bgFit',
] as const

export type SceneParams = Pick<SwingState, (typeof SCENE_PARAM_KEYS)[number]>

export function pickSceneParams(s: SceneParams): SceneParams {
  return Object.fromEntries(SCENE_PARAM_KEYS.map((k) => [k, s[k]])) as SceneParams
}
