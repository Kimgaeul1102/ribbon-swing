import { useSwingStore } from '../store/useSwingStore'

/** 인원 탭 — 선택한 인원이 아래 Layers/보관함의 편집 대상 */
function CharacterBar() {
  const characters = useSwingStore((s) => s.characters)
  const activeId = useSwingStore((s) => s.activeCharacterId)
  const setActive = useSwingStore((s) => s.setActiveCharacter)
  const addCharacter = useSwingStore((s) => s.addCharacter)
  const removeCharacter = useSwingStore((s) => s.removeCharacter)
  const renameCharacter = useSwingStore((s) => s.renameCharacter)
  const spacing = useSwingStore((s) => s.spacing)
  const setParam = useSwingStore((s) => s.setParam)

  const active = characters.find((c) => c.id === activeId)

  return (
    <section className="mb-6">
      <h2 className="mb-3 font-bold text-pink-600">Characters</h2>
      <div className="flex flex-wrap gap-2">
        {characters.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(c.id)}
            className={`max-w-32 truncate rounded-full border px-3 py-1 text-sm ${
              c.id === activeId
                ? 'border-pink-500 bg-pink-500 text-white'
                : 'border-pink-200 text-gray-600 hover:border-pink-400'
            }`}
          >
            {c.name}
          </button>
        ))}
        <button
          type="button"
          onClick={addCharacter}
          className="rounded-full border border-dashed border-pink-400 px-3 py-1 text-sm text-pink-500 hover:bg-pink-50"
        >
          + 인원 추가
        </button>
      </div>
      {characters.length > 1 && (
        <label className="mt-3 block text-sm">
          <span className="flex justify-between">
            인원 간격
            <span className="text-gray-500">{spacing}</span>
          </span>
          <input
            type="range"
            className="w-full accent-pink-500"
            min={0.2}
            max={1}
            step={0.01}
            value={spacing}
            onChange={(e) => setParam('spacing', Number(e.target.value))}
          />
          <span className="text-xs text-gray-400">줄이면 서로 가까워져요 (겹쳐질 수 있음)</span>
        </label>
      )}
      {active && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <input
            value={active.name}
            onChange={(e) => renameCharacter(active.id, e.target.value)}
            aria-label="인원 이름"
            className="min-w-0 flex-1 rounded border border-pink-200 px-2 py-1"
          />
          <button
            type="button"
            disabled={characters.length <= 1}
            onClick={() => {
              if (window.confirm(`"${active.name}"과(와) 이 인원의 레이어를 삭제할까요?`)) removeCharacter(active.id)
            }}
            className="text-gray-500 hover:text-pink-600 disabled:opacity-30"
          >
            인원 삭제
          </button>
        </div>
      )}
    </section>
  )
}

export default CharacterBar
