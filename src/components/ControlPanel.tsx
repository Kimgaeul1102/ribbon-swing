import { useSwingStore } from '../store/useSwingStore'

type SliderDef = {
  key: 'amplitude' | 'frequency' | 'damping' | 'wobble' | 'sway'
  label: string
  min: number
  max: number
  step: number
}

const SLIDERS: SliderDef[] = [
  { key: 'amplitude', label: '세기', min: 0, max: 45, step: 1 },
  { key: 'frequency', label: '속도', min: 0.2, max: 2, step: 0.05 },
  { key: 'damping', label: '감쇠', min: 0, max: 1, step: 0.01 },
  { key: 'wobble', label: '꿀렁임', min: 0, max: 1, step: 0.01 },
  { key: 'sway', label: '아래로 갈수록', min: 0, max: 1, step: 0.01 },
]

const REACTION_SLIDERS: {
  key: 'pushGap' | 'reactionSec'
  label: string
  min: number
  max: number
  step: number
}[] = [
  { key: 'pushGap', label: '차례 간격 (초)', min: 0.1, max: 1.5, step: 0.05 },
  { key: 'reactionSec', label: '밀린 표정 유지 (초)', min: 0.2, max: 3, step: 0.1 },
]

function ControlPanel() {
  const state = useSwingStore()

  return (
    <section className="mb-6">
      <h2 className="mb-3 font-bold text-pink-600">Controls</h2>
      {SLIDERS.map(({ key, label, min, max, step }) => (
        <label key={key} className="mb-3 block text-sm">
          <span className="flex justify-between">
            {label}
            <span className="text-gray-500">{state[key]}</span>
          </span>
          <input
            type="range"
            className="w-full accent-pink-500"
            min={min}
            max={max}
            step={step}
            value={state[key]}
            onChange={(e) => state.setParam(key, Number(e.target.value))}
          />
        </label>
      ))}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={state.pushSequential}
          className="flex-1 rounded bg-pink-500 py-1.5 text-sm text-white hover:bg-pink-600"
        >
          차례대로 밀기
        </button>
        <button
          type="button"
          onClick={state.pushAll}
          className="flex-1 rounded bg-pink-500 py-1.5 text-sm text-white hover:bg-pink-600"
        >
          한번에 밀기
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-400">차례대로: 1번 → 2번 → 3번… 순서로 밀려요</p>

      <h3 className="mb-2 mt-4 text-sm font-bold text-pink-500">밀기 반응</h3>
      {REACTION_SLIDERS.map(({ key, label, min, max, step }) => (
        <label key={key} className="mb-3 block text-sm">
          <span className="flex justify-between">
            {label}
            <span className="text-gray-500">{state[key]}</span>
          </span>
          <input
            type="range"
            className="w-full accent-pink-500"
            min={min}
            max={max}
            step={step}
            value={state[key]}
            onChange={(e) => state.setParam(key, Number(e.target.value))}
          />
        </label>
      ))}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={state.popEffect}
          onChange={(e) => state.setPopEffect(e.target.checked)}
          className="accent-pink-500"
        />
        뿅뿅 효과
      </label>
    </section>
  )
}

export default ControlPanel
