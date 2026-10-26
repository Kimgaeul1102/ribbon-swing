import { useSwingStore, type BgFit } from '../store/useSwingStore'
import SliderRow from './SliderRow'
import AssetPicker from './AssetPicker'

const FIT_OPTIONS: { value: BgFit; label: string }[] = [
  { value: 'cover', label: '꽉 채우기 (넘치는 부분은 잘림)' },
  { value: 'contain', label: '전체 보이기 (남는 곳은 배경색)' },
  { value: 'fill', label: '늘려 맞추기 (비율 무시)' },
]

/** 배경·화면 탭 — 줌, 배경색, 배경 그림 */
function ScreenPanel() {
  const s = useSwingStore()

  return (
    <section>
      <h2 className="mb-3 font-bold text-pink-600">화면</h2>
      <SliderRow
        label="줌 (작게 ↔ 크게)"
        value={s.zoom}
        min={0.5}
        max={1.5}
        step={0.05}
        onChange={(v) => s.setParam('zoom', v)}
        hint="캐릭터와 리본만 커지거나 작아지고, 배경은 그대로예요"
      />

      <h3 className="mb-2 mt-5 text-sm font-bold text-pink-500">배경</h3>
      <label className="mb-3 flex items-center justify-between text-sm">
        배경색
        <input
          type="color"
          value={s.bgColor}
          onChange={(e) => s.setBgColor(e.target.value)}
          className="h-8 w-14 cursor-pointer rounded border border-pink-200 bg-white p-0.5"
        />
      </label>
      <AssetPicker
        kind="background"
        selectedId={s.bgAssetId}
        onSelect={s.setBgAsset}
        uploadLabel="+ 배경 그림 올리기"
        noneLabel="배경 그림 빼기"
      />
      {s.bgAssetId && (
        <label className="mt-3 block text-sm">
          맞춤 방식
          <select
            value={s.bgFit}
            onChange={(e) => s.setBgFit(e.target.value as BgFit)}
            className="mt-1 w-full rounded border border-pink-200 bg-white px-2 py-1"
          >
            {FIT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </section>
  )
}

export default ScreenPanel
