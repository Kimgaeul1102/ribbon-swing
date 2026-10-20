import type { Layer } from '../store/useSwingStore'
import type { Frame } from '../utils/frame'
import { layerElements } from '../utils/layerElements'

type CharacterLayerProps = {
  layer: Layer
  frame: Frame // 캐릭터 프레임 (투명 여백을 자른 영역) 안에서의 위치 계산용
}

/**
 * 개별 레이어 — transform(회전·기울임·늘어남)은 rAF 루프에서 직접 갱신 (layerElements 레지스트리 경유).
 * will-change: transform으로 레이어마다 GPU 합성 레이어가 되어 움직임이 부드럽다.
 */
function CharacterLayer({ layer, frame }: CharacterLayerProps) {
  if (!layer.enabled) return null
  const rect = frame.rect(layer)
  const origin = frame.localPivot(layer)
  return (
    <div
      ref={(el) => {
        if (el) layerElements.set(layer.id, el)
        else layerElements.delete(layer.id)
      }}
      className="absolute"
      style={{
        left: `${rect.left}%`,
        top: `${rect.top}%`,
        width: `${rect.width}%`,
        height: `${rect.height}%`,
        zIndex: layer.zIndex,
        transformOrigin: `${origin.x * 100}% ${origin.y * 100}%`,
        willChange: 'transform',
      }}
    >
      <img
        src={layer.src}
        alt={layer.name}
        draggable={false}
        className="block h-full w-full max-w-none select-none"
      />
    </div>
  )
}

export default CharacterLayer
