import { useMarbleStore } from '../store/useMarbleStore'
import Slider from './Slider'

/** 구슬 물리/모양 + 카메라 + 트랙 그림 */
function PhysicsSettings() {
  const s = useMarbleStore()
  const { marble } = s

  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-pink-600">구슬 · 물리</h2>
      <Slider label="구슬 크기(반지름)" value={marble.radius} min={8} max={30} step={1} onChange={(radius) => s.setMarble({ radius })} />
      <Slider label="탄성" value={marble.restitution} min={0} max={1} step={0.05} onChange={(restitution) => s.setMarble({ restitution })} />
      <Slider label="중력" value={s.gravity} min={0.3} max={2} step={0.1} onChange={s.setGravity} />
      <Slider label="제한 시간(초)" value={s.timeoutSec} min={10} max={120} step={5} onChange={s.setTimeoutSec} />
      <label className="mb-1 flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={marble.rotateSprite} onChange={(e) => s.setMarble({ rotateSprite: e.target.checked })} />
        그림도 같이 굴러가기
      </label>
      <label className="mb-3 flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={s.followCamera} onChange={(e) => s.setFollowCamera(e.target.checked)} />
        선두 구슬 따라가기
      </label>

      <h2 className="mb-2 text-sm font-bold text-pink-600">트랙 그림</h2>
      <p className="mb-2 text-xs text-gray-500">직접 그린 트랙 PNG를 올리면 그 위에 보이지 않는 충돌체가 얹혀요. (600 × 월드 높이 비율)</p>
      <div className="flex gap-2">
        <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-pink-300 py-2 text-center text-sm text-pink-600 hover:bg-pink-50">
          그림 올리기
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) s.setTrackOverlay(URL.createObjectURL(f))
              e.target.value = ''
            }}
          />
        </label>
        {s.trackOverlay && (
          <button
            type="button"
            onClick={() => s.setTrackOverlay(null)}
            className="rounded-lg border border-pink-300 px-3 text-sm text-pink-600 hover:bg-pink-50"
          >
            빼기
          </button>
        )}
      </div>
    </section>
  )
}

export default PhysicsSettings
