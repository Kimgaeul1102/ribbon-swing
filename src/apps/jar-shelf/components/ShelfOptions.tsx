import { Section, SelectField, SliderField } from '../../../shared/ui/fields'
import { LABEL_FONTS } from '../config'
import { useShelfStore } from '../store/useShelfStore'

/** 병조림 선반 전용 설정 */
function ShelfOptions() {
  const { cfg, set, reset } = useShelfStore()
  return (
    <Section title="선반 설정">
      <SelectField
        label="선반 단 수"
        value={String(cfg.rows) as '1' | '2'}
        options={[
          { value: '1', label: '1단' },
          { value: '2', label: '2단' },
        ]}
        onChange={(v) => set({ rows: v === '1' ? 1 : 2 })}
      />
      <SelectField
        label="용기 모양"
        value={cfg.jarShape}
        options={[
          { value: 'jar', label: '유리병' },
          { value: 'can', label: '캔' },
        ]}
        onChange={(jarShape) => set({ jarShape })}
      />
      <SelectField label="라벨 글꼴" value={cfg.labelFont} options={LABEL_FONTS} onChange={(labelFont) => set({ labelFont })} />
      <SliderField label="두드리는 사람 seed" value={cfg.seed} min={1} max={99} step={1} onChange={(seed) => set({ seed })} />
      <SliderField label="두드리는 시점" value={cfg.knockAt} min={0} max={1} step={0.01} onChange={(knockAt) => set({ knockAt })} />
      <SliderField label="깜빡임 기준 시점" value={cfg.blinkAt} min={0} max={1} step={0.01} onChange={(blinkAt) => set({ blinkAt })} />
      <button type="button" onClick={reset} className="text-xs text-gray-500 underline">
        기본값으로
      </button>
    </Section>
  )
}

export default ShelfOptions
