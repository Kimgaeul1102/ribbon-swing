import { useState } from 'react'
import { ColorField, Section, SelectField, SliderField } from '../../../shared/ui/fields'
import { FRAME_STYLES } from '../config'
import { useFrameStore } from '../store/useFrameStore'

/** 두드리는 시각 입력: 쉼표로 구분한 초 (예: 0.6, 1.8). 알아볼 수 없는 값은 무시 */
function parseTimes(text: string): number[] {
  return text
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0)
}

/** 액자 전용 설정 */
function FrameOptions() {
  const { cfg, set, reset } = useFrameStore()
  const [text, setText] = useState(cfg.knockTimes.join(', '))

  return (
    <Section title="액자 설정">
      <SelectField label="액자 모양" value={cfg.style} options={FRAME_STYLES} onChange={(style) => set({ style })} />
      <ColorField label="안쪽 배경색" value={cfg.bgColor} onChange={(bgColor) => set({ bgColor })} />
      <ColorField label="파문 색" value={cfg.rippleColor} onChange={(rippleColor) => set({ rippleColor })} />
      <label className="mb-2 block text-sm text-gray-600">
        두드리는 시각 (초, 쉼표로 구분)
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            const times = parseTimes(e.target.value)
            if (times.length > 0) set({ knockTimes: times })
          }}
          className="mt-1 w-full rounded border border-pink-200 bg-white px-2 py-1"
        />
        <span className="text-xs text-gray-500">한 번 두드릴 때마다 톡톡 2연타예요. 루프 길이보다 작은 값으로 넣어 주세요.</span>
      </label>
      <SliderField label="캐릭터 크기" value={cfg.charHeight} min={200} max={430} step={5} onChange={(charHeight) => set({ charHeight })} />
      <SliderField label="파문 위치 X" value={cfg.rippleX} min={0} max={1} step={0.01} onChange={(rippleX) => set({ rippleX })} />
      <SliderField label="파문 위치 Y" value={cfg.rippleY} min={0} max={1} step={0.01} onChange={(rippleY) => set({ rippleY })} />
      <button
        type="button"
        onClick={() => {
          reset()
          setText('0.6, 1.8')
        }}
        className="text-xs text-gray-500 underline"
      >
        기본값으로
      </button>
    </Section>
  )
}

export default FrameOptions
