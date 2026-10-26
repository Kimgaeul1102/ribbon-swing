import { SliderField } from '../ui/fields'
import { useCharacterStore } from './useCharacterStore'
import type { CharacterData, ExtraLayer } from './types'

function ExtraCard({ charId, layer }: { charId: string; layer: ExtraLayer }) {
  const update = useCharacterStore((s) => s.updateExtra)
  const remove = useCharacterStore((s) => s.removeExtra)
  const set = (patch: Partial<Omit<ExtraLayer, 'id' | 'url'>>) => update(charId, layer.id, patch)

  return (
    <li className="rounded-lg border border-pink-100 p-2">
      <div className="mb-2 flex items-center gap-2">
        <img src={layer.url} alt="" className="h-9 w-9 shrink-0 rounded border border-pink-100 bg-white object-contain" />
        <input value={layer.name} onChange={(e) => set({ name: e.target.value })} className="min-w-0 flex-1 rounded border border-pink-200 bg-white px-2 py-1 text-sm" />
        <button type="button" onClick={() => remove(charId, layer.id)} aria-label={`${layer.name} 빼기`} className="text-sm text-gray-400 hover:text-red-500">
          ✕
        </button>
      </div>
      <SliderField label="흔들림 강도" value={layer.strength} min={0} max={3} step={0.1} onChange={(strength) => set({ strength })} />
      <SliderField label="늦게 따라오는 시간" value={layer.lag} min={0} max={0.6} step={0.01} unit="초" onChange={(lag) => set({ lag })} />
      <SliderField label="살랑거리는 속도" value={layer.speed} min={0.5} max={2} step={0.1} unit="x" onChange={(speed) => set({ speed })} />
      <SliderField label="기준점 가로 (몸에 붙은 곳)" value={layer.pivotX} min={0} max={1} step={0.01} onChange={(pivotX) => set({ pivotX })} />
      <SliderField label="기준점 세로" value={layer.pivotY} min={0} max={1} step={0.01} onChange={(pivotY) => set({ pivotY })} />
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={layer.behind} onChange={(e) => set({ behind: e.target.checked })} />
        몸 뒤에 그리기 (뒷머리 등)
      </label>
    </li>
  )
}

/**
 * 흔들릴 부분 레이어: 이름 상관없이 PNG를 몇 장이든 추가. 레이어마다 강도/지연/속도/기준점을 따로 조절.
 * 몸 파츠와 같은 크기 캔버스에서 내보낸 PNG면 제자리에 겹쳐짐
 */
function ExtraLayersEditor({ character }: { character: CharacterData }) {
  const addExtras = useCharacterStore((s) => s.addExtras)
  const setHairSway = useCharacterStore((s) => s.setHairSway)

  return (
    <div>
      <h3 className="mb-1 text-sm font-bold text-pink-600">흔들릴 부분 레이어</h3>
      <p className="mb-2 text-xs text-gray-500">
        머리 묶음, 리본, 꼬리처럼 따로 흔들고 싶은 부분을 PNG로 올리세요. 파일 이름은 아무거나 괜찮아요. 몸 파츠와 같은 크기 캔버스에서 내보낸 그림이면 제자리에 겹쳐져요. 강도를 키우면 몸보다 늦게, 더 크게 흔들려요.
      </p>
      {character.parts.hair && (
        <SliderField label="머리카락 추가 흔들림 (0 = 없음)" value={character.hairSway} min={0} max={3} step={0.1} onChange={(v) => setHairSway(character.id, v)} />
      )}
      {character.extras.length > 0 && (
        <ul className="mb-2 flex flex-col gap-2">
          {character.extras.map((x) => (
            <ExtraCard key={x.id} charId={character.id} layer={x} />
          ))}
        </ul>
      )}
      <label className="block cursor-pointer rounded-lg border border-dashed border-pink-300 py-2 text-center text-sm text-pink-600 hover:bg-pink-50">
        + 흔들릴 부분 PNG 추가
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addExtras(character.id, Array.from(e.target.files))
            e.target.value = ''
          }}
        />
      </label>
    </div>
  )
}

export default ExtraLayersEditor
