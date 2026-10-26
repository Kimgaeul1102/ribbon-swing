import { useState } from 'react'
import { useSwingStore } from '../store/useSwingStore'
import { createSlot, parseSlots, pickMotion, type MotionSlot } from '../utils/motionSlots'

const KEY = 'ribbon-swing:motions'

function load(): MotionSlot[] {
  try {
    return parseSlots(localStorage.getItem(KEY))
  } catch {
    return []
  }
}

/** 움직임 슬롯 — 지금 슬라이더 값들을 이름 붙여 저장해 두고 한 번에 불러온다 */
function MotionSlots() {
  const [slots, setSlots] = useState<MotionSlot[]>(load)
  const [name, setName] = useState('')
  const [failed, setFailed] = useState(false)

  const persist = (next: MotionSlot[]) => {
    setSlots(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
      setFailed(false)
    } catch {
      setFailed(true) // 저장소를 못 쓰는 환경(사생활 보호 모드 등)
    }
  }

  const current = () => pickMotion(useSwingStore.getState())

  const save = () => {
    persist([...slots, createSlot(name || `움직임 ${slots.length + 1}`, current())])
    setName('')
  }

  const apply = (slot: MotionSlot) => useSwingStore.setState(slot.values)

  const overwrite = (slot: MotionSlot) => {
    if (window.confirm(`"${slot.name}"을(를) 지금 값으로 덮어쓸까요?`))
      persist(slots.map((x) => (x.id === slot.id ? { ...x, values: current(), savedAt: Date.now() } : x)))
  }

  const remove = (slot: MotionSlot) => {
    if (window.confirm(`"${slot.name}"을(를) 지울까요?`)) persist(slots.filter((x) => x.id !== slot.id))
  }

  return (
    <section className="mb-5 rounded border border-pink-200 p-3">
      <h2 className="mb-1 font-bold text-pink-600">움직임 슬롯</h2>
      <p className="mb-2 text-xs text-gray-400">
        지금 슬라이더 값(세기·속도·감쇠·말랑함·아래로 갈수록·계속 흔들기·끈 흔들림·밀기 반응)을 저장해 두고 다시 불러와요.
        그림·레이어별 설정은 포함되지 않아요.
      </p>
      <div className="mb-2 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="이름 (예: 살랑살랑)"
          aria-label="슬롯 이름"
          className="min-w-0 flex-1 rounded border border-pink-200 bg-white px-2 py-1 text-sm"
        />
        <button type="button" onClick={save} className="rounded bg-pink-500 px-3 py-1 text-sm text-white hover:bg-pink-600">
          저장
        </button>
      </div>
      {failed && <p className="mb-2 text-xs text-red-600">이 브라우저에서는 저장할 수 없어요. 이 화면을 닫으면 사라져요.</p>}
      {slots.length === 0 ? (
        <p className="text-xs text-gray-400">저장된 슬롯이 없어요.</p>
      ) : (
        <ul>
          {slots.map((slot) => (
            <li key={slot.id} className="mb-1 rounded border border-pink-100 px-2 py-1 text-sm">
              <div className="flex items-center gap-1">
                <span className="min-w-0 flex-1 truncate font-medium">{slot.name}</span>
                <button type="button" onClick={() => apply(slot)} className="rounded bg-pink-100 px-2 text-pink-700 hover:bg-pink-200">
                  불러오기
                </button>
                <button type="button" onClick={() => overwrite(slot)} className="px-1 text-xs text-gray-500 hover:text-pink-600">
                  덮어쓰기
                </button>
                <button type="button" aria-label="슬롯 삭제" onClick={() => remove(slot)} className="px-1 text-gray-400 hover:text-pink-600">
                  ✕
                </button>
              </div>
              <p className="text-xs text-gray-400">
                세기 {slot.values.amplitude} · 속도 {slot.values.frequency} · 감쇠 {slot.values.damping} · 말랑 {slot.values.wobble}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default MotionSlots
