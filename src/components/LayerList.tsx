import { useRef, useState } from 'react'
import { useSwingStore } from '../store/useSwingStore'
import { useLibraryStore } from '../store/useLibraryStore'
import LayerSettings from './LayerSettings'

/** 레이어 목록 — 업로드/삭제/순서, [⋮]로 레이어 설정 펼치기 */
function LayerList() {
  const allLayers = useSwingStore((s) => s.layers)
  const activeId = useSwingStore((s) => s.activeCharacterId)
  const activeName = useSwingStore((s) => s.characters.find((c) => c.id === s.activeCharacterId)?.name)
  const layers = allLayers.filter((l) => l.characterId === activeId)
  const updateLayer = useSwingStore((s) => s.updateLayer)
  const removeLayer = useSwingStore((s) => s.removeLayer)
  const moveLayer = useSwingStore((s) => s.moveLayer)
  const uploadAsLayers = useLibraryStore((s) => s.uploadAsLayers)
  const inputRef = useRef<HTMLInputElement>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  // 위쪽(앞쪽) 레이어가 목록 위에 오도록
  const sorted = [...layers].sort((a, b) => b.zIndex - a.zIndex)

  return (
    <section className="mb-6">
      <h2 className="mb-3 font-bold text-pink-600">Layers · {activeName}</h2>
      {sorted.length === 0 && <p className="text-sm text-gray-400">레이어가 없습니다</p>}
      <ul>
        {sorted.map((l, i) => (
          <li key={l.id} className="py-1 text-sm">
           <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={l.enabled}
              onChange={(e) => updateLayer(l.id, { enabled: e.target.checked })}
            />
            <span className="min-w-0 flex-1 truncate">
              {l.name}
              {l.expression === 'normal' && <span className="ml-1 text-xs text-gray-400">(평소)</span>}
              {l.expression === 'hit' && <span className="ml-1 text-xs text-pink-400">(밀림)</span>}
            </span>
            <button
              type="button"
              aria-label="레이어 설정"
              aria-expanded={openId === l.id}
              onClick={() => setOpenId(openId === l.id ? null : l.id)}
              className={`px-1 ${openId === l.id ? 'text-pink-600' : 'text-gray-500'}`}
            >
              ⋮
            </button>
            <button
              type="button"
              aria-label="앞으로"
              disabled={i === 0}
              onClick={() => moveLayer(l.id, 'up')}
              className="px-1 text-gray-500 disabled:opacity-30"
            >
              ▲
            </button>
            <button
              type="button"
              aria-label="뒤로"
              disabled={i === sorted.length - 1}
              onClick={() => moveLayer(l.id, 'down')}
              className="px-1 text-gray-500 disabled:opacity-30"
            >
              ▼
            </button>
            <button
              type="button"
              aria-label="레이어 제거"
              onClick={() => removeLayer(l.id)}
              className="px-1 text-gray-400 hover:text-pink-600"
            >
              ✕
            </button>
           </div>
           {openId === l.id && <LayerSettings layer={l} onClose={() => setOpenId(null)} />}
          </li>
        ))}
      </ul>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = '' // 같은 파일을 다시 골라도 change가 발생하도록
          void uploadAsLayers(files)
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-3 text-sm text-pink-500 hover:text-pink-600"
      >
        + 레이어 추가 (PNG 여러 장 선택 가능)
      </button>
    </section>
  )
}

export default LayerList
