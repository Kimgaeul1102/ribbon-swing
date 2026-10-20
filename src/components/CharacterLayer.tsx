import { useSwingStore, type Layer } from '../store/useSwingStore'
import { layerElements } from '../utils/layerElements'
import { SWAY_STRIPS } from '../utils/pendulum'

type CharacterLayerProps = {
  layer: Layer
}

/**
 * 개별 레이어 — transform은 rAF 루프에서 직접 갱신 (layerElements 레지스트리 경유).
 * "아래로 갈수록" 효과가 켜져 있으면 같은 이미지를 가로 띠 SWAY_STRIPS장으로 겹쳐 그리고,
 * 띠마다 translateX를 다르게 줘서 아래쪽이 더 휘어 보이게 한다. (기준 이미지는 크기 확보용으로 숨김)
 */
function CharacterLayer({ layer }: CharacterLayerProps) {
  const strips = useSwingStore((s) => s.sway > 0)
  if (!layer.enabled) return null
  return (
    // 모든 레이어가 같은 박스에 겹치므로 같은 캔버스 크기의 PNG끼리 정확히 맞물림
    <div
      className="pointer-events-none absolute inset-x-0 top-20 flex h-[70%] justify-center"
      style={{ zIndex: layer.zIndex }}
    >
      <div
        ref={(el) => {
          if (el) layerElements.set(layer.id, el)
          else layerElements.delete(layer.id)
        }}
        className="relative h-full"
        style={{ transformOrigin: `${layer.pivot.x * 100}% ${layer.pivot.y * 100}%` }}
      >
        <img
          src={layer.src}
          alt={layer.name}
          draggable={false}
          className={`block h-full w-auto max-w-none select-none ${strips ? 'invisible' : ''}`}
        />
        {strips &&
          Array.from({ length: SWAY_STRIPS }, (_, k) => (
            <img
              key={k}
              src={layer.src}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full max-w-none select-none"
              // 띠 사이에 틈이 보이지 않도록 아래로 0.4%씩 겹침
              style={{
                clipPath: `inset(${(k / SWAY_STRIPS) * 100}% -100% ${((SWAY_STRIPS - k - 1) / SWAY_STRIPS) * 100 - 0.4}% -100%)`,
              }}
            />
          ))}
      </div>
    </div>
  )
}

export default CharacterLayer
