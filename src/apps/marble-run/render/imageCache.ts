const cache = new Map<string, HTMLImageElement>()

/** 이미지를 한 번만 불러와 재사용. 아직 로딩 중이면 null (그 프레임은 색 구슬로 그림) */
export function getImage(src: string): HTMLImageElement | null {
  let img = cache.get(src)
  if (!img) {
    img = new Image()
    img.src = src
    cache.set(src, img)
  }
  return img.complete && img.naturalWidth > 0 ? img : null
}
