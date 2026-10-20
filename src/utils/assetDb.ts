import type { Layer } from '../store/useSwingStore'

/** 보관함(이미지)과 저장된 세트를 브라우저 IndexedDB에 보관 — 새로고침/재방문해도 유지됨 */
const DB_NAME = 'ribbon-swing'
const DB_VERSION = 1

export type StoredAsset = { id: string; name: string; hash: string; blob: Blob; createdAt: number }

export type StoredSetLayer = Omit<Layer, 'id' | 'src' | 'characterId'>

/** 한 캐릭터의 레이어 구성(옷 세트). 이전 버전이 저장한 params 필드는 무시한다 */
export type StoredSet = {
  id: string
  name: string
  createdAt: number
  layers: StoredSetLayer[]
}

type StoreName = 'assets' | 'sets'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore('assets', { keyPath: 'id' })
      req.result.createObjectStore('sets', { keyPath: 'id' })
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

export function put(store: StoreName, value: StoredAsset | StoredSet): Promise<IDBValidKey> {
  return run(store, 'readwrite', (s) => s.put(value))
}

export function remove(store: StoreName, id: string): Promise<undefined> {
  return run(store, 'readwrite', (s) => s.delete(id))
}
