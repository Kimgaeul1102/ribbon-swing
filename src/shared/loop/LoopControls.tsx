import { useEffect, useState } from 'react'
import { SliderField } from '../ui/fields'
import type { LoopPlayer } from './useLoopPlayer'
import { useLoopSettings } from './useLoopSettings'

const btn = 'rounded-full border border-pink-300 px-3 py-1 text-sm text-pink-600 hover:bg-pink-50 disabled:opacity-40'

const SIZES = [
  { id: '600x600', w: 600, h: 600, label: '600 × 600 (정사각)' },
  { id: '800x600', w: 800, h: 600, label: '800 × 600 (가로)' },
  { id: '600x800', w: 600, h: 800, label: '600 × 800 (세로)' },
]

/** 현재 재생 시간 표시 (ref를 가끔 읽을 뿐이라 앱 전체를 다시 그리지 않음) */
function TimeLabel({ player }: { player: LoopPlayer }) {
  const loop = useLoopSettings((s) => s.loopSec)
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT(player.getTime()), 100)
    return () => clearInterval(id)
  }, [player])
  return (
    <span className="tabular-nums text-xs text-gray-500">
      {t.toFixed(2)} / {loop}초
    </span>
  )
}

/** 루프 길이 / 재생·일시정지 / 프레임 이동 / 녹화 / 배경 / 크기 */
function LoopControls({ player }: { player: LoopPlayer }) {
  const s = useLoopSettings()
  const sizeId = `${s.stageW}x${s.stageH}`

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btn} onClick={player.togglePlay}>
          {player.playing ? '⏸ 일시정지' : '▶ 재생'}
        </button>
        <button type="button" className={btn} onClick={() => player.step(-1)} aria-label="이전 프레임">
          ◀
        </button>
        <button type="button" className={btn} onClick={() => player.step(1)} aria-label="다음 프레임">
          ▶
        </button>
        <TimeLabel player={player} />
      </div>
      <button type="button" className={`${btn} border-red-300 text-red-500 hover:bg-red-50`} disabled={player.recording} onClick={player.record}>
        {player.recording ? '⏺ 녹화 중… (한 루프)' : '⏺ 녹화해서 WebM 저장'}
      </button>
      <SliderField label="루프 길이" value={s.loopSec} min={1} max={30} step={0.5} unit="초" onChange={s.setLoopSec} />
      <label className="flex items-center justify-between gap-2 text-sm text-gray-600">
        크기
        <select
          value={SIZES.some((z) => z.id === sizeId) ? sizeId : '600x600'}
          onChange={(e) => {
            const z = SIZES.find((x) => x.id === e.target.value)!
            s.setStageSize(z.w, z.h)
          }}
          className="rounded border border-pink-200 bg-white px-2 py-1"
        >
          {SIZES.map((z) => (
            <option key={z.id} value={z.id}>
              {z.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center justify-between gap-2 text-sm text-gray-600">
        <span className="flex items-center gap-2">
          <input type="checkbox" checked={s.bg !== null} onChange={(e) => s.setBg(e.target.checked ? '#ffffff' : null)} />
          배경색 넣기 (끄면 투명)
        </span>
        {s.bg !== null && <input type="color" value={s.bg} onChange={(e) => s.setBg(e.target.value)} className="h-7 w-12 cursor-pointer rounded border border-pink-200 bg-white" />}
      </label>
      <p className="text-xs text-gray-500">← → 키로 한 프레임씩 이동해요. 투명 배경 녹화는 브라우저에 따라 검은 배경이 될 수 있어요. 그럴 땐 배경색을 넣어 주세요.</p>
    </div>
  )
}

export default LoopControls
