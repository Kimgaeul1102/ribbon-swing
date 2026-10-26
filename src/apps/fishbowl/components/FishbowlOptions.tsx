import { ColorField, SliderField, Section } from '../../../shared/ui/fields'
import { useFishbowlStore } from '../store/useFishbowlStore'

/** 어항 전용 설정 */
function FishbowlOptions() {
  const { cfg, set, reset } = useFishbowlStore()
  return (
    <Section title="어항 설정">
      <ColorField label="물 색" value={cfg.waterColor} onChange={(waterColor) => set({ waterColor })} />
      <SliderField label="거품 개수 (루프당)" value={cfg.bubbleCount} min={3} max={5} step={1} onChange={(bubbleCount) => set({ bubbleCount })} />
      <SliderField label="머리카락 지연" value={cfg.hairLag} min={0} max={1} step={0.05} unit="초" onChange={(hairLag) => set({ hairLag })} />
      <SliderField label="부유 폭" value={cfg.bobAmp} min={0} max={40} step={1} unit="px" onChange={(bobAmp) => set({ bobAmp })} />
      <SliderField label="기울기" value={cfg.tiltDeg} min={0} max={15} step={0.5} unit="°" onChange={(tiltDeg) => set({ tiltDeg })} />
      <SliderField label="입 위치(거품 나오는 곳)" value={cfg.mouthY} min={0.2} max={0.7} step={0.01} onChange={(mouthY) => set({ mouthY })} />
      <SliderField label="깜빡임 시점" value={cfg.blinkAt} min={0} max={1} step={0.01} onChange={(blinkAt) => set({ blinkAt })} />
      <SliderField label="거품 seed" value={cfg.seed} min={1} max={99} step={1} onChange={(seed) => set({ seed })} />
      <button type="button" onClick={reset} className="text-xs text-gray-500 underline">
        기본값으로
      </button>
    </Section>
  )
}

export default FishbowlOptions
