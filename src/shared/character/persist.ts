import type { ExtraLayer, PartName } from './types'

/**
 * 올린 캐릭터 그림을 브라우저(IndexedDB)에 저장해서 새로고침해도 남게 함. 서버로는 아무것도 안 보냄.
 * 'kv' 저장소 하나에 설정(meta)과 그림 파일(Blob)을 키로 구분해 넣음
 */
const DB_NAME = 'ribbon-swing-characters'
const STORE = 'kv'

export type SavedCharacter = {
  id: string
  name: string
  /** 그림이 저장돼 있는 파츠 이름들 (그림 자체는 blobKey로 따로 저장) */
  parts: PartName[]
  extras: Omit<ExtraLayer, 'url'>[]
  hairSway: number
}

export const partKey = (charId: string, part: PartName) => `${charId}:${part}`
export const extraKey = (charId: string, extraId: string) => `${charId}:x:${extraId}`

export const persistAvailable = () => typeof indexedDB !== 'undefined'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** 저장 실패(시크릿 모드 등)는 조용히 무시: 앱은 저장 없이도 그대로 동작해야 함 */
export async function putValue(key: string, value: unknown): Promise<void> {
  if (!persistAvailable()) return
  try {
    await run('readwrite', (s) => s.put(value, key))
  } catch {
    /* 무시 */
  }
}

export async function getValue<T>(key: string): Promise<T | undefined> {
  if (!persistAvailable()) return undefined
  try {
    return (await run('readonly', (s) => s.get(key))) as T | undefined
  } catch {
    return undefined
  }
}

export async function deleteValue(key: string): Promise<void> {
  if (!persistAvailable()) return
  try {
    await run('readwrite', (s) => s.delete(key))
  } catch {
    /* 무시 */
  }
}

export const META_KEY = 'meta'
