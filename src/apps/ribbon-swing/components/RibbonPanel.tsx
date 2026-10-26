import { useSwingStore } from '../store/useSwingStore'
import SliderRow from './SliderRow'
import AssetPicker from './AssetPicker'

/** 리본 탭 — 끈 길이/굵기/흔들림, 리본 그림 */
function RibbonPanel() {
  const s = useSwingStore()

  return (
    <section>
      <h2 className="mb-3 font-bold text-pink-600">리본</h2>
      <SliderRow
        label="끈 길이 (px)"
        value={s.ribbonLength}
        min={0}
        max={400}
        step={5}
        onChange={(v) => s.setParam('ribbonLength', v)}
        hint="길이를 바꿔도 끈 끝은 그림에 이어져 있어요. 캐릭터에 달리는 높이는 인원·레이어 탭의 끈 위치로 정해요."
      />
      <SliderRow
        label="끈 굵기 / 그림 너비 (px)"
        value={s.ribbonWidth}
        min={2}
        max={160}
        step={1}
        onChange={(v) => s.setParam('ribbonWidth', v)}
      />
      <SliderRow
        label="리본 흔들림"
        value={s.ribbonSwing}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => s.setParam('ribbonSwing', v)}
        hint="0이면 끈이 가만히 있고 캐릭터만 흔들려요"
      />

      <h3 className="mb-2 mt-5 text-sm font-bold text-pink-500">리본 그림</h3>
      <p className="mb-2 text-xs text-gray-400">
        그림은 끈 길이만큼 세로로 늘어나 채워져요. 그림의 윗부분이 위(가로대) 쪽, 아랫부분이 캐릭터에 닿는 쪽이에요.
        투명 배경 PNG를 추천해요.
      </p>
      <AssetPicker
        kind="ribbon"
        selectedId={s.ribbonAssetId}
        onSelect={s.setRibbonAsset}
        uploadLabel="+ 리본 그림 올리기"
        noneLabel="기본 밧줄로"
      />
    </section>
  )
}

export default RibbonPanel
