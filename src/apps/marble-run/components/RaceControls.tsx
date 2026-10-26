import { PRESET_LIST } from '../track/presets'
import { useMarbleStore } from '../store/useMarbleStore'

const btn = 'rounded-full border border-pink-300 px-3 py-1 text-sm text-pink-600 hover:bg-pink-50'

/** 위쪽 고정 줄: 프리셋 / seed / 재시작 / 재생·일시정지 / 느리게 */
function RaceControls() {
  const s = useMarbleStore()
  const solo = s.characters.length === 1

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={s.restart}>
          ↺ 다시 시작
        </button>
        <button type="button" className={btn} onClick={() => s.setPlaying(!s.playing)}>
          {s.playing ? '⏸ 일시정지' : '▶ 재생'}
        </button>
        <button
          type="button"
          aria-pressed={s.slow}
          className={`${btn} ${s.slow ? 'bg-pink-100 font-bold' : ''}`}
          onClick={() => s.setSlow(!s.slow)}
        >
          🐢 느리게 0.5x
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600">
        트랙
        <select
          value={s.presetId}
          disabled={solo}
          onChange={(e) => s.setPreset(e.target.value as typeof s.presetId)}
          className="flex-1 rounded border border-pink-200 bg-white px-2 py-1"
        >
          {PRESET_LIST.filter((p) => p.id !== 'solo').map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      {solo && <p className="text-xs text-gray-500">캐릭터가 1명이라 솔로 트랙으로 자동 전환돼요.</p>}
      <label className="flex items-center gap-2 text-sm text-gray-600">
        seed
        <input
          type="number"
          value={s.seed}
          onChange={(e) => s.setSeed(Math.floor(Number(e.target.value)) || 0)}
          className="w-24 rounded border border-pink-200 bg-white px-2 py-1"
        />
        <button type="button" className={btn} onClick={() => s.setSeed(Math.floor(Math.random() * 100000))}>
          🎲
        </button>
      </label>
      <p className="text-xs text-gray-500">같은 seed면 항상 같은 결과가 나와요. 참가 {s.characters.length}명</p>
    </div>
  )
}

export default RaceControls
