/** 짧은 고유 ID — crypto.randomUUID는 http(비보안) 환경에서 없을 수 있어 직접 생성 */
export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

/** id 문자열 → 0 이상 1 미만의 고정된 값. 인원마다 흔들림 위상을 다르게 하려는 용도 */
export function seedFromId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}
