/** 레이어 id → DOM. rAF 루프가 React 리렌더 없이 style.transform을 직접 갱신하기 위한 레지스트리 */
export const layerElements = new Map<string, HTMLElement>()

/** 캐릭터 id → 리본+캐릭터 묶음 DOM. 위쪽 가로대(상단 중앙)를 기준으로 회전해서 리본이 매달린 채 흔들리게 함 */
export const ribbonElements = new Map<string, HTMLElement>()
