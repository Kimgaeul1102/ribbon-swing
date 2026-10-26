import type { ReactNode } from 'react'

type SliderProps = { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void }

/** 슬라이더 한 줄 (라벨 + 값 표시) */
export function SliderField({ label, value, min, max, step, unit = '', onChange }: SliderProps) {
  return (
    <label className="mb-2 block text-sm text-gray-600">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="tabular-nums text-pink-600">
          {value}
          {unit}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-pink-500" />
    </label>
  )
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="mb-2 flex items-center justify-between text-sm text-gray-600">
      {label}
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-12 cursor-pointer rounded border border-pink-200 bg-white" />
    </label>
  )
}

export function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="mb-2 flex items-center gap-2 text-sm text-gray-600">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

export function SelectField<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <label className="mb-2 flex items-center justify-between gap-2 text-sm text-gray-600">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className="rounded border border-pink-200 bg-white px-2 py-1">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="mb-2 flex items-center justify-between gap-2 text-sm text-gray-600">
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-32 rounded border border-pink-200 bg-white px-2 py-1" />
    </label>
  )
}

/** 설정 묶음 제목 + 내용 */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-pink-600">{title}</h2>
      {children}
    </section>
  )
}
