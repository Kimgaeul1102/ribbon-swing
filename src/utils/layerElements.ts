/** 레이어 id → DOM. rAF 루프가 React 리렌더 없이 style.transform을 직접 갱신하기 위한 레지스트리 */
export const layerElements = new Map<string, HTMLElement>()
