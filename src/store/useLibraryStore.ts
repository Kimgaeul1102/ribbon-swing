import { create } from 'zustand'
import { useSwingStore } from './useSwingStore'
import { getAll, put, remove, type StoredAsset, type StoredSet } from '../utils/assetDb'
import { createLayer } from '../utils/layerPresets'
import { newId } from '../utils/id'

export type LibraryAsset = { id: string; name: string; hash: string; url: string }

type LibraryState = {
  assets: LibraryAsset[]
  sets: StoredSet[]
  init: () => Promise<void>
  /** 파일을 보관함에 저장(같은 이미지는 재사용)하고 레이어로 추가 */
  uploadAsLayers: (files: File[]) => Promise<void>
  addLayerFromAsset: (assetId: string) => void
  removeAsset: (id: string) => void
  saveSet: (name: string) => void
  applySet: (id: string) => void
  deleteSet: (id: string) => void
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

function nextZIndex(): number {
  const zs = activeLayers().map((l) => l.zIndex)
  return zs.length ? Math.max(...zs) + 1 : 0
}

let initPromise: Promise<void> | null = null

export const useLibraryStore = create<LibraryState>((set, get) => {
  async function importAssets(files: File[]): Promise<LibraryAsset[]> {
    const result: LibraryAsset[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      const hash = await hashBlob(file, file.name)
      let asset = get().assets.find((a) => a.hash === hash)
      if (!asset) {
        const fresh: LibraryAsset = {
          id: newId(),
          name: file.name.replace(/\.[^.]+$/, ''),
          hash,
          url: URL.createObjectURL(file),
        }
        asset = fresh
        set((s) => ({ assets: [...s.assets, fresh] }))
        const stored: StoredAsset = { id: fresh.id, name: fresh.name, hash, blob: file, createdAt: Date.now() }
        put('assets', stored).catch(warn)
      }
      result.push(asset)
    }
    return result
  }

  return {
    assets: [],
    sets: [],

    init: () => {
      initPromise ??= (async () => {
        try {
          const [assets, sets] = await Promise.all([getAll<StoredAsset>('assets'), getAll<StoredSet>('sets')])
          assets.sort((a, b) => a.createdAt - b.createdAt)
          sets.sort((a, b) => a.createdAt - b.createdAt)
          set({
            assets: assets.map((a) => ({ id: a.id, name: a.name, hash: a.hash, url: URL.createObjectURL(a.blob) })),
            sets,
          })
        } catch (e) {
          console.warn('보관함을 불러오지 못했습니다:', e)
        }
      })()
      return initPromise
    },

    uploadAsLayers: async (files) => {
      const assets = await importAssets(files)
      const { addLayer, kickCharacter, activeCharacterId } = useSwingStore.getState()
      let z = nextZIndex()
      for (const asset of assets) addLayer(createLayer(asset, z++, activeCharacterId))
      if (assets.length) kickCharacter(activeCharacterId)
    },

    addLayerFromAsset: (assetId) => {
      const asset = get().assets.find((a) => a.id === assetId)
      if (!asset) return
      const { addLayer, kickCharacter, activeCharacterId } = useSwingStore.getState()
      addLayer(createLayer(asset, nextZIndex(), activeCharacterId))
      kickCharacter(activeCharacterId)
    },

    removeAsset: (id) => {
      const asset = get().assets.find((a) => a.id === id)
      if (!asset) return
      useSwingStore.setState((s) => ({ layers: s.layers.filter((l) => l.assetId !== id) }))
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
        layers: activeLayers().map((l) => ({
          assetId: l.assetId,
          expression: l.expression,
          name: l.name,
          zIndex: l.zIndex,
          pivot: { ...l.pivot },
          delay: l.delay,
          amplitudeMul: l.amplitudeMul,
          stiffness: l.stiffness,
          enabled: l.enabled,
        })),
      }
      set((s) => ({ sets: existing ? s.sets.map((x) => (x.id === saved.id ? saved : x)) : [...s.sets, saved] }))
      put('sets', saved).catch(warn)
    },

    applySet: (id) => {
      const saved = get().sets.find((s) => s.id === id)
      if (!saved) return
      // 선택된 캐릭터의 레이어만 교체 (다른 인원은 그대로)
      const { activeCharacterId } = useSwingStore.getState()
      const layers = saved.layers.flatMap((l) => {
        const asset = get().assets.find((a) => a.id === l.assetId)
        return asset
          ? [
              {
                ...l,
                id: newId(),
                characterId: activeCharacterId,
                expression: l.expression ?? 'always', // 예전에 저장한 세트에는 없음
                src: asset.url,
                pivot: { ...l.pivot },
              },
            ]
          : []
      })
      useSwingStore.setState((s) => ({
        layers: [...s.layers.filter((l) => l.characterId !== activeCharacterId), ...layers],
      }))
      useSwingStore.getState().kickCharacter(activeCharacterId)
    },

    deleteSet: (id) => {
      set((s) => ({ sets: s.sets.filter((x) => x.id !== id) }))
      remove('sets', id).catch(warn)
    },
  }
})
