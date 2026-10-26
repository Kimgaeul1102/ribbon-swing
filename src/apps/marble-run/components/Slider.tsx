type Props = {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}

/** 슬라이더 한 줄 (라벨 + 값 표시) */
function Slider({ label, value, min, max, step, onChange }: Props) {
  return (
    <label className="mb-2 block text-sm text-gray-600">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="tabular-nums text-pink-600">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-pink-500"
      />
    </label>
  )
}

export default Slider
