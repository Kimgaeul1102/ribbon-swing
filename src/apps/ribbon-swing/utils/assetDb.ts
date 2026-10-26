import type { Layer, SceneParams } from '../store/useSwingStore'
import type { Box, Size } from './trim'

/** 보관함(이미지)·저장된 세트·컨셉(장면)을 브라우저 IndexedDB에 보관 — 새로고침/재방문해도 유지됨 */
const DB_NAME = 'ribbon-swing'
const DB_VERSION = 2 // 2: 컨셉(scenes) 추가

/** 이미지 용도: 캐릭터 레이어 / 리본 그림 / 배경 그림 (이전 버전에서 저장한 이미지에는 없음 → 레이어) */
export type AssetKind = 'layer' | 'ribbon' | 'background'

// canvas/bbox는 이전 버전에서 저장한 이미지에는 없음 → 불러올 때 계산해서 채움
export type StoredAsset = {
  id: string
  name: string
  hash: string
  blob: Blob
  createdAt: number
  kind?: AssetKind
  canvas?: Size
  bbox?: Box
}

// groupId는 저장 당시 폴더 id (불러올 때 새 id로 바꿔 끼움). 폴더가 생기기 전에 저장한 세트에는 없음
export type StoredSetLayer = Omit<Layer, 'id' | 'src' | 'characterId' | 'canvas' | 'bbox'>

/** 한 캐릭터의 레이어 구성(옷 세트). 이전 버전이 저장한 params 필드는 무시한다 */
export type StoredSet = {
  id: string
  name: string
  createdAt: number
  groups?: { id: string; name: string }[] // 폴더(저장 당시 순서 = 올린 순서). 없으면 세트 전체가 폴더 하나
  attachY?: number // 끈이 달린 높이 (이전 버전에서 저장한 세트에는 없음 → 첫 레이어 pivot 높이로 대신함)
  layers: StoredSetLayer[]
}

/** 컨셉(장면 전체): 설정 값 + 배경/리본 그림 + 인원/폴더/레이어 구성 */
export type StoredScene = {
  id: string
  name: string
  createdAt: number
  params: SceneParams
  characters: { key: string; name: string; attachY: number }[]
  groups: { id: string; characterKey: string; name: string; createdAt: number }[]
  layers: (StoredSetLayer & { characterKey: string })[]
}

type StoreName = 'assets' | 'sets' | 'scenes'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      // 버전이 올라가도 이미 있는 저장소/데이터는 그대로 두고 없는 것만 만든다
      for (const name of ['assets', 'sets', 'scenes'] as const) {
        if (!req.result.objectStoreNames.contains(name)) req.result.createObjectStore(name, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  dbPromise ??= openDb()
  const db = await dbPromise
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(store, mode).objectStore(store))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export function getAll<T>(store: StoreName): Promise<T[]> {
  return run(store, 'readonly', (s) => s.getAll() as IDBRequest<T[]>)
}

export function put(store: StoreName, value: StoredAsset | StoredSet | StoredScene): Promise<IDBValidKey> {
  return run(store, 'readwrite', (s) => s.put(value))
}

export function remove(store: StoreName, id: string): Promise<undefined> {
  return run(store, 'readwrite', (s) => s.delete(id))
}
