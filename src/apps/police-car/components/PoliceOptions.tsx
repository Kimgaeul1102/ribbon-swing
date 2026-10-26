import { CheckField, ColorField, Section, SliderField } from '../../../shared/ui/fields'
import { usePoliceStore } from '../store/usePoliceStore'

/** 경찰차 전용 설정 */
function PoliceOptions() {
  const { cfg, set, reset } = usePoliceStore()
  return (
    <Section title="경찰차 설정">
      <SliderField label="경광등 속도" value={cfg.lightSpeed} min={0.5} max={3} step={0.5} unit="x" onChange={(lightSpeed) => set({ lightSpeed })} />
      <ColorField label="도시 색" value={cfg.cityColor} onChange={(cityColor) => set({ cityColor })} />
      <CheckField label="앞좌석 철망 보이기" checked={cfg.showMesh} onChange={(showMesh) => set({ showMesh })} />
      <SliderField label="수갑 위치 X" value={cfg.cuffsX} min={150} max={450} step={2} onChange={(cuffsX) => set({ cuffsX })} />
      <SliderField label="수갑 위치 Y" value={cfg.cuffsY} min={350} max={580} step={2} onChange={(cuffsY) => set({ cuffsY })} />
      <SliderField label="캐릭터 크기" value={cfg.charHeight} min={250} max={560} step={5} onChange={(charHeight) => set({ charHeight })} />
      <SliderField label="목 위치 (고개 돌리는 축)" value={cfg.neckY} min={0.2} max={0.7} step={0.01} onChange={(neckY) => set({ neckY })} />
      <SliderField label="고개 돌리는 시점" value={cfg.turnAt} min={0} max={1} step={0.01} onChange={(turnAt) => set({ turnAt })} />
      <SliderField label="한숨 시점" value={cfg.sighAt} min={0} max={1} step={0.01} onChange={(sighAt) => set({ sighAt })} />
      <SliderField label="깜빡임 시점" value={cfg.blinkAt} min={0} max={1} step={0.01} onChange={(blinkAt) => set({ blinkAt })} />
      <button type="button" onClick={reset} className="text-xs text-gray-500 underline">
        기본값으로
      </button>
    </Section>
  )
}

export default PoliceOptions
