type SliderRowProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  display?: string // 값 대신 보여줄 글자 (단위 붙이기 등)
  hint?: string
  dimmed?: boolean
}

/** 라벨 + 현재 값 + 슬라이더 한 줄 */
function SliderRow({ label, value, min, max, step, onChange, display, hint, dimmed }: SliderRowProps) {
  return (
    <label className={`mb-3 block text-sm ${dimmed ? 'opacity-50' : ''}`}>
      <span className="flex justify-between">
        {label}
        <span className="text-gray-500">{display ?? value}</span>
      </span>
      <input
        type="range"
        className="w-full accent-pink-500"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </label>
  )
}

export default SliderRow
