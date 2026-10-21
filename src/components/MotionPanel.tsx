import { useSwingStore } from '../store/useSwingStore'
import SliderRow from './SliderRow'
import MotionSlots from './MotionSlots'

/** 움직임 탭 — 흔들림의 세기/속도/감쇠, 말랑함, 아래로 갈수록, 계속 흔들기 세기, 밀기 반응 */
function MotionPanel() {
  const s = useSwingStore()

  return (
    <section>
      <MotionSlots />
      <h2 className="mb-3 font-bold text-pink-600">움직임</h2>
      <SliderRow label="세기" value={s.amplitude} min={0} max={45} step={1} onChange={(v) => s.setParam('amplitude', v)} />
      <SliderRow label="속도" value={s.frequency} min={0.2} max={2} step={0.05} onChange={(v) => s.setParam('frequency', v)} />
      <SliderRow label="감쇠" value={s.damping} min={0} max={1} step={0.01} onChange={(v) => s.setParam('damping', v)} />
      <SliderRow
        label="말랑함"
        value={s.wobble}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => s.setParam('wobble', v)}
        hint="빠르게 움직일 때 세로로 늘어났다 통통 튀며 돌아와요"
      />
      <SliderRow
        label="아래로 갈수록"
        value={s.sway}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => s.setParam('sway', v)}
        hint="아래쪽이 더 크게, 부드럽게 흔들려요"
      />

      <h3 className="mb-2 mt-5 text-sm font-bold text-pink-500">계속 흔들기</h3>
      <SliderRow
        label="세기"
        value={s.idleStrength}
        display={`${s.idleStrength}°`}
        min={0}
        max={20}
        step={0.5}
        onChange={(v) => s.setParam('idleStrength', v)}
        dimmed={!s.idleOn}
        hint='위쪽 "계속 흔들기" 버튼으로 켜요. 속도는 위의 "속도"를 따라가요.'
      />

      <h3 className="mb-2 mt-5 text-sm font-bold text-pink-500">밀기 반응</h3>
      <SliderRow
        label="차례 간격 (초)"
        value={s.pushGap}
        min={0.1}
        max={1.5}
        step={0.05}
        onChange={(v) => s.setParam('pushGap', v)}
      />
      <SliderRow
        label="밀린 표정 유지 (초)"
        value={s.reactionSec}
        min={0.2}
        max={3}
        step={0.1}
        onChange={(v) => s.setParam('reactionSec', v)}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={s.popEffect}
          onChange={(e) => s.setPopEffect(e.target.checked)}
          className="accent-pink-500"
        />
        뿅뿅 효과
      </label>
    </section>
  )
}

export default MotionPanel
