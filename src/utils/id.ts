/** 짧은 고유 ID — crypto.randomUUID는 http(비보안) 환경에서 없을 수 있어 직접 생성 */
export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}
