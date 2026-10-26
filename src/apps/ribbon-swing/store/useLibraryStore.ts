import { create } from 'zustand'
import {
  useSwingStore,
  pickSceneParams,
  type Character,
  type Layer,
  type LayerGroup,
} from './useSwingStore'
import {
  getAll,
  put,
  remove,
  type AssetKind,
  type StoredAsset,
  type StoredScene,
  type StoredSet,
  type StoredSetLayer,
} from '../utils/assetDb'
import { createLayer } from '../utils/layerPresets'
import { computeCrop } from '../utils/groups'
import { newId } from '../utils/id'
import { measureImage, type Box, type Size } from '../utils/trim'

export type LibraryAsset = {
  id: string
  name: string
  hash: string
  url: string
  kind: AssetKind
  canvas: Size
  bbox: Box
}

type LibraryState = {
  assets: LibraryAsset[]
  sets: StoredSet[]
  scenes: StoredScene[]
  init: () => Promise<void>
  /** 파일을 보관함에 저장(같은 이미지는 재사용)하고, 한 폴더로 묶어 레이어로 추가 */
  uploadAsLayers: (files: File[]) => Promise<void>
  /** 리본/배경 그림 등 레이어가 아닌 이미지를 보관함에 저장하고 돌려줌 */
  uploadImages: (files: File[], kind: AssetKind) => Promise<LibraryAsset[]>
  /** 프로그램이 만든 이미지(밧줄 등)를 보관함에 저장하고 새 폴더로 추가. copyFrom이 있으면 그 레이어의 움직임 설정을 따라감 */
  addGeneratedLayer: (blob: Blob, name: string, copyFrom?: Layer) => Promise<void>
  addLayerFromAsset: (assetId: string) => void
  removeAsset: (id: string) => void
  saveSet: (name: string) => void
  applySet: (id: string) => void
  deleteSet: (id: string) => void
  saveScene: (name: string) => void
  applyScene: (id: string) => void
  deleteScene: (id: string) => void
}

const warn = (e: unknown) => console.warn('보관함 저장 실패 (이번 세션에서만 유지됨):', e)

/** 같은 파일 판별용 내용 해시. 비보안 환경(crypto.subtle 없음)이면 크기+이름으로 대체 */
async function hashBlob(blob: Blob, name: string): Promise<string> {
  if (!crypto.subtle) return `${blob.size}-${name}`
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function activeLayers() {
  const { layers, activeCharacterId } = useSwingStore.getState()
  return layers.filter((l) => l.characterId === activeCharacterId)
}

function activeGroups() {
  const { groups, activeCharacterId } = useSwingStore.getState()
  return groups.filter((g) => g.characterId === activeCharacterId)
}

function activeAttachY(): number {
  const { characters, activeCharacterId } = useSwingStore.getState()
  return characters.find((c) => c.id === activeCharacterId)?.attachY ?? 0
}

function nextZIndex(): number {
  const zs = activeLayers().map((l) => l.zIndex)
  return zs.length ? Math.max(...zs) + 1 : 0
}

/** 이미지들로 폴더 하나(+레이어들)를 만든다. 자를 영역은 지금 만들 때 한 번 계산해서 고정 */
function buildFolder(name: string, assets: LibraryAsset[]): { group: LayerGroup; layers: Layer[] } {
  const { activeCharacterId } = useSwingStore.getState()
  const groupId = newId()
  let z = nextZIndex()
  const layers = assets.map((a) => createLayer(a, z++, activeCharacterId, groupId, activeAttachY()))
  const group: LayerGroup = {
    id: groupId,
    characterId: activeCharacterId,
    name,
    createdAt: Date.now(),
    collapsed: false,
    ...computeCrop(layers),
  }
  return { group, layers }
}

/** 저장용으로 레이어에서 id/이미지 주소/캔버스 정보(이미지에서 다시 구함)를 뺀다 */
function toStoredLayer(l: Layer): StoredSetLayer {
  return {
    groupId: l.groupId,
    assetId: l.assetId,
    expression: l.expression,
    name: l.name,
    zIndex: l.zIndex,
    pivot: { ...l.pivot },
    delay: l.delay,
    speedMul: l.speedMul,
    amplitudeMul: l.amplitudeMul,
    stiffness: l.stiffness,
    waveMul: l.waveMul,
    swayMul: l.swayMul,
    enabled: l.enabled,
  }
}

/** 저장된 레이어를 다시 레이어로. 예전에 저장한 데이터에 없는 항목은 기본값 */
function restoreLayer(stored: StoredSetLayer, asset: LibraryAsset, characterId: string, groupId: string): Layer {
  return {
    ...stored,
    id: newId(),
    characterId,
    groupId,
    expression: stored.expression ?? 'always',
    speedMul: stored.speedMul ?? 1,
    waveMul: stored.waveMul ?? 1,
    swayMul: stored.swayMul ?? 1,
    src: asset.url,
    canvas: asset.canvas,
    bbox: asset.bbox,
    pivot: { ...stored.pivot },
  }
}

let initPromise: Promise<void> | null = null

export const useLibraryStore = create<LibraryState>((set, get) => {
  async function importAssets(files: File[], kind: AssetKind): Promise<LibraryAsset[]> {
    const result: LibraryAsset[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      const hash = await hashBlob(file, file.name)
      let asset = get().assets.find((a) => a.hash === hash && a.kind === kind)
      if (!asset) {
        let measured
        try {
          measured = await measureImage(file)
        } catch (e) {
          console.warn(`이미지를 읽을 수 없어 건너뜁니다: ${file.name}`, e)
          continue
        }
        const fresh: LibraryAsset = {
          id: newId(),
          name: file.name.replace(/\.[^.]+$/, ''),
          hash,
          url: URL.createObjectURL(file),
          kind,
          ...measured,
        }
        asset = fresh
        set((s) => ({ assets: [...s.assets, fresh] }))
        const stored: StoredAsset = {
          id: fresh.id,
          name: fresh.name,
          hash,
          blob: file,
          createdAt: Date.now(),
          kind,
          ...measured,
        }
        put('assets', stored).catch(warn)
      }
      result.push(asset)
    }
    return result
  }

  return {
    assets: [],
    sets: [],
    scenes: [],

    init: () => {
      initPromise ??= (async () => {
        try {
          const [assets, sets, scenes] = await Promise.all([
            getAll<StoredAsset>('assets'),
            getAll<StoredSet>('sets'),
            getAll<StoredScene>('scenes'),
          ])
          assets.sort((a, b) => a.createdAt - b.createdAt)
          sets.sort((a, b) => a.createdAt - b.createdAt)
          scenes.sort((a, b) => a.createdAt - b.createdAt)
          // 이전 버전에서 저장한 이미지는 크기/내용 영역 정보가 없으니 지금 계산해서 채운다
          const measuredAssets = await Promise.all(
            assets.map(async (a) => {
              if (a.canvas && a.bbox) return { ...a, canvas: a.canvas, bbox: a.bbox }
              try {
                const filled = { ...a, ...(await measureImage(a.blob)) }
                put('assets', filled).catch(warn)
                return filled
              } catch (e) {
                console.warn(`이미지 정보를 읽지 못했습니다: ${a.name}`, e)
                return { ...a, canvas: { w: 1, h: 1 }, bbox: { x: 0, y: 0, w: 1, h: 1 } }
              }
            }),
          )
          set({
            assets: measuredAssets.map((a) => ({
              id: a.id,
              name: a.name,
              hash: a.hash,
              url: URL.createObjectURL(a.blob),
              kind: a.kind ?? 'layer',
              canvas: a.canvas,
              bbox: a.bbox,
            })),
            sets,
            scenes,
          })
        } catch (e) {
          console.warn('보관함을 불러오지 못했습니다:', e)
        }
      })()
      return initPromise
    },

    uploadImages: (files, kind) => importAssets(files, kind),

    uploadAsLayers: async (files) => {
      const assets = await importAssets(files, 'layer')
      if (!assets.length) return
      // 한 번에 올린 이미지는 한 폴더로 묶어 같은 여백으로 자른다
      const name = assets.length === 1 ? assets[0].name : `${assets[0].name} 외 ${assets.length - 1}장`
      const { group, layers } = buildFolder(name, assets)
      const { addGroup, kickCharacter } = useSwingStore.getState()
      addGroup(group, layers)
      kickCharacter(group.characterId)
    },

    addGeneratedLayer: async (blob, name, copyFrom) => {
      const [asset] = await importAssets([new File([blob], `${name}.png`, { type: 'image/png' })], 'layer')
      if (!asset) return
      const { group, layers } = buildFolder(name, [asset])
      if (copyFrom) {
        // 몸과 같은 움직임(지연/속도/크기/강성/회전 기준점)을 줘서 밧줄이 몸에 붙어 움직이게 함
        const { delay, speedMul, amplitudeMul, stiffness, waveMul, swayMul, pivot } = copyFrom
        layers[0] = { ...layers[0], delay, speedMul, amplitudeMul, stiffness, waveMul, swayMul, pivot: { ...pivot } }
      }
      const { addGroup, kickCharacter } = useSwingStore.getState()
      addGroup(group, layers)
      kickCharacter(group.characterId)
    },

    addLayerFromAsset: (assetId) => {
      const asset = get().assets.find((a) => a.id === assetId)
      if (!asset) return
      const { group, layers } = buildFolder(asset.name, [asset])
      const { addGroup, kickCharacter } = useSwingStore.getState()
      addGroup(group, layers)
      kickCharacter(group.characterId)
    },

    removeAsset: (id) => {
      const asset = get().assets.find((a) => a.id === id)
      if (!asset) return
      const store = useSwingStore.getState()
      store.removeAssetLayers(id)
      if (store.ribbonAssetId === id) store.setRibbonAsset(null)
      if (store.bgAssetId === id) store.setBgAsset(null)
      URL.revokeObjectURL(asset.url)
      set((s) => ({ assets: s.assets.filter((a) => a.id !== id) }))
      remove('assets', id).catch(warn)
    },

    // 선택된 캐릭터의 레이어 구성을 저장. 같은 이름으로 저장하면 덮어씀 (커미션 세트를 갱신하기 쉽게)
    saveSet: (rawName) => {
      const name = rawName.trim()
      if (!name) return
      const existing = get().sets.find((s) => s.name === name)
      const saved: StoredSet = {
        id: existing?.id ?? newId(),
        name,
        createdAt: existing?.createdAt ?? Date.now(),
        attachY: activeAttachY(),
        // 폴더는 올린 순서대로 (첫 폴더가 불러올 때도 기준 폴더)
        groups: activeGroups()
          .filter((g) => activeLayers().some((l) => l.groupId === g.id))
          .sort((a, b) => a.createdAt - b.createdAt)
          .map((g) => ({ id: g.id, name: g.name })),
        layers: activeLayers().map(toStoredLayer),
      }
      set((s) => ({ sets: existing ? s.sets.map((x) => (x.id === saved.id ? saved : x)) : [...s.sets, saved] }))
      put('sets', saved).catch(warn)
    },

    applySet: (id) => {
      const saved = get().sets.find((s) => s.id === id)
      if (!saved) return
      // 선택된 캐릭터의 레이어만 교체 (다른 인원은 그대로)
      const { activeCharacterId } = useSwingStore.getState()
      // 폴더: 저장된 폴더들을 새 id로 다시 만든다. 폴더가 생기기 전에 저장한 세트는 세트 전체가 폴더 하나
      const savedGroups = saved.groups?.length ? saved.groups : [{ id: '', name: saved.name }]
      const idMap = new Map(savedGroups.map((g) => [g.id, newId()]))
      const fallbackGroup = idMap.get(savedGroups[0].id)!
      const layers = saved.layers.flatMap((l) => {
        const asset = get().assets.find((a) => a.id === l.assetId)
        const groupId = (l.groupId !== undefined && idMap.get(l.groupId)) || fallbackGroup
        return asset ? [restoreLayer(l, asset, activeCharacterId, groupId)] : []
      })
      // 세트에 저장된 끈 위치를 이 인원에 적용 (예전 세트는 첫 레이어의 회전 기준점 높이로 대신함)
      const attachY = saved.attachY ?? saved.layers[0]?.pivot.y ?? 0
      // 자를 영역은 폴더 멤버로 다시 계산해서 고정 (순서대로 createdAt을 줘서 첫 폴더가 기준 폴더)
      const base = Date.now()
      const groups: LayerGroup[] = savedGroups.flatMap((g, i) => {
        const members = layers.filter((l) => l.groupId === idMap.get(g.id))
        return members.length
          ? [
              {
                id: idMap.get(g.id)!,
                characterId: activeCharacterId,
                name: g.name,
                createdAt: base + i,
                collapsed: false,
                ...computeCrop(members),
              },
            ]
          : []
      })
      useSwingStore.setState((s) => ({
        characters: s.characters.map((c) => (c.id === activeCharacterId ? { ...c, attachY } : c)),
      }))
      useSwingStore.getState().replaceCharacterContent(activeCharacterId, groups, layers)
      useSwingStore.getState().kickCharacter(activeCharacterId)
    },

    deleteSet: (id) => {
      set((s) => ({ sets: s.sets.filter((x) => x.id !== id) }))
      remove('sets', id).catch(warn)
    },

    // 컨셉(장면 전체) 저장: 설정 값 + 배경/리본 그림 + 모든 인원의 폴더/레이어. 같은 이름이면 덮어씀
    saveScene: (rawName) => {
      const name = rawName.trim()
      if (!name) return
      const s = useSwingStore.getState()
      const existing = get().scenes.find((x) => x.name === name)
      const saved: StoredScene = {
        id: existing?.id ?? newId(),
        name,
        createdAt: existing?.createdAt ?? Date.now(),
        params: pickSceneParams(s),
        characters: s.characters.map((c) => ({ key: c.id, name: c.name, attachY: c.attachY })),
        groups: s.groups
          .filter((g) => s.layers.some((l) => l.groupId === g.id))
          .sort((a, b) => a.createdAt - b.createdAt)
          .map((g) => ({ id: g.id, characterKey: g.characterId, name: g.name, createdAt: g.createdAt })),
        layers: s.layers.map((l) => ({ ...toStoredLayer(l), characterKey: l.characterId })),
      }
      set((st) => ({ scenes: existing ? st.scenes.map((x) => (x.id === saved.id ? saved : x)) : [...st.scenes, saved] }))
      put('scenes', saved).catch(warn)
    },

    applyScene: (id) => {
      const saved = get().scenes.find((x) => x.id === id)
      if (!saved || !saved.characters.length) return
      const now = performance.now()
      const charIds = new Map(saved.characters.map((c) => [c.key, newId()]))
      const groupIds = new Map(saved.groups.map((g) => [g.id, newId()]))

      const characters: Character[] = saved.characters.map((c) => ({
        id: charIds.get(c.key)!,
        name: c.name,
        attachY: c.attachY,
        swingStartedAt: now,
        reactedAt: 0,
      }))
      const layers = saved.layers.flatMap((l) => {
        const asset = get().assets.find((a) => a.id === l.assetId)
        const characterId = charIds.get(l.characterKey)
        const groupId = groupIds.get(l.groupId)
        return asset && characterId && groupId ? [restoreLayer(l, asset, characterId, groupId)] : []
      })
      const groups: LayerGroup[] = saved.groups.flatMap((g) => {
        const members = layers.filter((l) => l.groupId === groupIds.get(g.id))
        return members.length
          ? [
              {
                id: groupIds.get(g.id)!,
                characterId: charIds.get(g.characterKey)!,
                name: g.name,
                createdAt: g.createdAt,
                collapsed: false,
                ...computeCrop(members),
              },
            ]
          : []
      })
      // 배경/리본 그림이 보관함에서 지워졌으면 해제
      const exists = (assetId: string | null) => assetId !== null && get().assets.some((a) => a.id === assetId)
      const params = {
        ...saved.params,
        ribbonAssetId: exists(saved.params.ribbonAssetId) ? saved.params.ribbonAssetId : null,
        bgAssetId: exists(saved.params.bgAssetId) ? saved.params.bgAssetId : null,
      }
      const store = useSwingStore.getState()
      store.applyScene(params, characters, groups, layers)
      store.pushAll()
    },

    deleteScene: (id) => {
      set((s) => ({ scenes: s.scenes.filter((x) => x.id !== id) }))
      remove('scenes', id).catch(warn)
    },
  }
})
