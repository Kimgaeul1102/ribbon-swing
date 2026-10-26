import { CheckField, ColorField, Section, SliderField, TextField } from '../../../shared/ui/fields'
import { useCharacterStore } from '../../../shared/character/useCharacterStore'
import { useLoopSettings } from '../../../shared/loop/useLoopSettings'
import { useBoxStore } from '../store/useBoxStore'

/** 택배 박스 전용 설정 */
function BoxOptions() {
  const { cfg, set, reset } = useBoxStore()
  const n = useCharacterStore((s) => s.characters.length)
  const loop = useLoopSettings((s) => s.loopSec)

  return (
    <Section title="박스 설정">
      <p className="mb-2 text-xs text-gray-500">
        캐릭터가 {n}명이라 한 명당 {(loop / n).toFixed(1)}초씩 나와요. 위의 루프 길이를 바꾸면 한 명당 시간이 달라져요.
        {n === 1 && ' (1명이면 같은 캐릭터가 계속 나와요)'}
      </p>
      <SliderField label="가운데 멈춰 있는 비율" value={cfg.holdRatio} min={0.3} max={0.8} step={0.05} onChange={(holdRatio) => set({ holdRatio })} />
      <CheckField label="스티커에 캐릭터 이름 쓰기" checked={cfg.nameOnSticker} onChange={(nameOnSticker) => set({ nameOnSticker })} />
      {!cfg.nameOnSticker && <TextField label="스티커 글자" value={cfg.label} onChange={(label) => set({ label })} />}
      <ColorField label="박스 색" value={cfg.boxColor} onChange={(boxColor) => set({ boxColor })} />
      <SliderField label="가려지는 높이 (cutY)" value={cfg.cutY} min={200} max={460} step={2} onChange={(cutY) => set({ cutY })} />
      <SliderField label="캐릭터 크기" value={cfg.charHeight} min={200} max={520} step={5} onChange={(charHeight) => set({ charHeight })} />
      <SliderField label="깜빡임 시점" value={cfg.blinkAt} min={0} max={1} step={0.01} onChange={(blinkAt) => set({ blinkAt })} />
      <SliderField label="둘러보기 시점" value={cfg.lookAt} min={0} max={1} step={0.01} onChange={(lookAt) => set({ lookAt })} />
      <button type="button" onClick={reset} className="text-xs text-gray-500 underline">
        기본값으로
      </button>
    </Section>
  )
}

export default BoxOptions
