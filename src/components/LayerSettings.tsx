import { useRef } from 'react'
import { useSwingStore, type Layer } from '../store/useSwingStore'
import type { Expression } from '../store/useSwingStore'
import type { Frame } from '../utils/frame'
import { guessPreset } from '../utils/layerPresets'

type LayerSettingsProps = {
  layer: Layer
  frame: Frame // 캐릭터 프레임 (pivot 지정 화면 표시용)
  onClose: () => void
}

type SliderDef = {
  key: 'delay' | 'speedMul' | 'amplitudeMul' | 'stiffness' | 'waveMul' | 'swayMul'
  percent?: boolean // 값(배율)을 %로 표시
  label: string
  hint: string
  min: number
  max: number
  step: number
}

const SLIDERS: SliderDef[] = [
  { key: 'delay', label: '지연 (ms)', hint: '클수록 본체보다 늦게 반응', min: 0, max: 300, step: 5 },
  { key: 'speedMul', label: '속도', percent: true, hint: '낮을수록 천천히 흔들림 (100% = 본체와 같음)', min: 0.5, max: 1.5, step: 0.05 },
  { key: 'amplitudeMul', label: '흔들림 크기', percent: true, hint: '클수록 더 크게 흔들림', min: 0.5, max: 2, step: 0.05 },
  { key: 'stiffness', label: '강성', hint: '낮을수록 흐물흐물 (1이면 본체에 딱 붙음)', min: 0.05, max: 1, step: 0.01 },
  { key: 'waveMul', label: '말랑함', percent: true, hint: '전체 말랑함 슬라이더에 곱해져요. 0%면 이 레이어만 안 늘어남', min: 0, max: 2, step: 0.05 },
  { key: 'swayMul', label: '아래로 갈수록', percent: true, hint: '전체 슬라이더에 곱해져요. 0%면 이 레이어만 안 쏠림', min: 0, max: 2, step: 0.05 },
]

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** 개별 레이어 설정 — delay / amplitudeMul / stiffness 슬라이더 + 이미지를 눌러/끌어서 pivot 지정 */
function LayerSettings({ layer, frame, onClose }: LayerSettingsProps) {
  const updateLayer = useSwingStore((s) => s.updateLayer)
  const rect = frame.rect(layer)
  const pickerRef = useRef<HTMLDivElement>(null)

  const setPivotFromPointer = (e: React.PointerEvent) => {
    const rect = pickerRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return
    updateLayer(layer.id, {
      pivot: { x: clamp01((e.clientX - rect.left) / rect.width), y: clamp01((e.clientY - rect.top) / rect.height) },
    })
  }

  return (
    <div className="mb-2 rounded border border-pink-200 bg-pink-50/50 p-3 text-sm">
      {SLIDERS.map(({ key, label, hint, min, max, step, percent }) => (
        <label key={key} className="mb-2 block">
          <span className="flex justify-between">
            {label}
            <span className="text-gray-500">{percent ? `${Math.round(layer[key] * 100)}%` : layer[key]}</span>
          </span>
          <input
            type="range"
            className="w-full accent-pink-500"
            min={min}
            max={max}
            step={step}
            value={layer[key]}
            onChange={(e) => updateLayer(layer.id, { [key]: Number(e.target.value) })}
          />
          <span className="text-xs text-gray-400">{hint}</span>
        </label>
      ))}

      <label className="mb-2 mt-3 block">
        표시 조건 (표정 교체용)
        <select
          value={layer.expression}
          onChange={(e) => updateLayer(layer.id, { expression: e.target.value as Expression })}
          className="mt-1 w-full rounded border border-pink-200 bg-white px-2 py-1"
        >
          <option value="always">항상 보임</option>
          <option value="normal">평소에만 (밀리면 숨김)</option>
          <option value="hit">밀렸을 때만</option>
        </select>
        <span className="text-xs text-gray-400">평소 얼굴은 "평소에만", 놀란 얼굴은 "밀렸을 때만"으로 지정하세요.</span>
      </label>

      <p className="mb-1 mt-3">
        회전 기준점 (pivot){' '}
        <span className="text-gray-500">
          {Math.round(layer.pivot.x * 100)}%, {Math.round(layer.pivot.y * 100)}%
        </span>
      </p>
      <p className="mb-2 text-xs text-gray-400">이미지를 누르거나 끌어서 회전 기준점을 정하세요. (끈 위치 슬라이더를 움직이면 이 인원 모든 레이어의 기준점 높이가 따라가요)</p>
      <div className="flex justify-center">
        <div
          ref={pickerRef}
          // 잘린 영역(프레임) 기준으로 보여줌 — pivot도 이 박스 기준 비율
          className="relative h-40 max-w-full cursor-crosshair touch-none select-none"
          style={{ aspectRatio: frame.aspect }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            setPivotFromPointer(e)
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) setPivotFromPointer(e)
          }}
        >
          <div className="absolute inset-0 overflow-hidden rounded border border-pink-100 bg-white">
            <img
              src={layer.src}
              alt={layer.name}
              draggable={false}
              className="absolute max-w-none"
              style={{
                left: `${rect.left}%`,
                top: `${rect.top}%`,
                width: `${rect.width}%`,
                height: `${rect.height}%`,
              }}
            />
          </div>
          <span
            className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-pink-600 shadow"
            style={{ left: `${layer.pivot.x * 100}%`, top: `${layer.pivot.y * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex justify-between">
        <button
          type="button"
          onClick={() => {
            const preset = guessPreset(layer.name)
            // 회전 기준점 높이는 끈이 달린 높이를 유지
            updateLayer(layer.id, { ...preset, pivot: { x: preset.pivot.x, y: layer.pivot.y } })
          }}
          className="text-gray-500 hover:text-pink-600"
        >
          이름 기준 기본값으로
        </button>
        <button type="button" onClick={onClose} className="text-pink-500 hover:text-pink-600">
          닫기
        </button>
      </div>
    </div>
  )
}

export default LayerSettings
