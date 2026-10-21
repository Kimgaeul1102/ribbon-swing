import { useRef, useState } from 'react'
import { useSwingStore } from '../store/useSwingStore'
import { useLibraryStore } from '../store/useLibraryStore'
import LayerSettings from './LayerSettings'
import { layoutFor } from '../utils/frame'
import { orderedGroups } from '../utils/groups'

/**
 * 레이어 목록 — 한 번에 올린 이미지는 한 폴더로 묶여 같은 여백으로 잘린다.
 * 폴더는 접고 펼 수 있고, 폴더 단위로 켜고 끄고/앞뒤 이동/삭제. 펼치면 안의 레이어를 따로 설정([⋮])할 수 있다.
 */
function LayerList() {
  const allLayers = useSwingStore((s) => s.layers)
  const allGroups = useSwingStore((s) => s.groups)
  const activeId = useSwingStore((s) => s.activeCharacterId)
  const activeName = useSwingStore((s) => s.characters.find((c) => c.id === s.activeCharacterId)?.name)
  const updateLayer = useSwingStore((s) => s.updateLayer)
  const removeLayer = useSwingStore((s) => s.removeLayer)
  const moveLayer = useSwingStore((s) => s.moveLayer)
  const moveGroup = useSwingStore((s) => s.moveGroup)
  const removeGroup = useSwingStore((s) => s.removeGroup)
  const renameGroup = useSwingStore((s) => s.renameGroup)
  const setGroupCollapsed = useSwingStore((s) => s.setGroupCollapsed)
  const setGroupEnabled = useSwingStore((s) => s.setGroupEnabled)
  const uploadAsLayers = useLibraryStore((s) => s.uploadAsLayers)
  const inputRef = useRef<HTMLInputElement>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const trim = useSwingStore((s) => s.trim)
  const setTrim = useSwingStore((s) => s.setTrim)

  const layers = allLayers.filter((l) => l.characterId === activeId)
  const openLayer = layers.find((l) => l.id === openId) ?? null
  const charGroups = allGroups.filter((g) => g.characterId === activeId)
  const frame = layoutFor(charGroups, layers, trim)
  // 위쪽(앞쪽) 폴더가 목록 위에 오도록
  const groups = orderedGroups(charGroups, layers).reverse()

  return (
    <section className="mb-6">
      <h2 className="mb-3 font-bold text-pink-600">Layers · {activeName}</h2>
      {groups.length === 0 && <p className="text-sm text-gray-400">레이어가 없습니다</p>}
      <ul>
        {groups.map((g, gi) => {
          // 폴더 안에서도 위쪽(앞쪽) 레이어가 위에 오도록
          const members = layers.filter((l) => l.groupId === g.id).sort((a, b) => b.zIndex - a.zIndex)
          const allOn = members.every((l) => l.enabled)
          const someOn = members.some((l) => l.enabled)
          return (
            <li key={g.id} className="mb-2 rounded border border-pink-100">
              <div className="flex items-center gap-1 bg-pink-50/60 px-2 py-1 text-sm">
                <button
                  type="button"
                  aria-label={g.collapsed ? '폴더 펼치기' : '폴더 접기'}
                  aria-expanded={!g.collapsed}
                  onClick={() => setGroupCollapsed(g.id, !g.collapsed)}
                  className="w-5 text-gray-500"
                >
                  {g.collapsed ? '▸' : '▾'}
                </button>
                <input
                  type="checkbox"
                  aria-label="폴더 전체 켜고 끄기"
                  checked={allOn}
                  ref={(el) => {
                    if (el) el.indeterminate = someOn && !allOn
                  }}
                  onChange={(e) => setGroupEnabled(g.id, e.target.checked)}
                />
                <input
                  value={g.name}
                  aria-label="폴더 이름"
                  onChange={(e) => renameGroup(g.id, e.target.value)}
                  className="mx-1 min-w-0 flex-1 truncate rounded border border-transparent bg-transparent px-1 font-medium hover:border-pink-200 focus:border-pink-300"
                />
                <span className="text-xs text-gray-400">{members.length}장</span>
                <button
                  type="button"
                  aria-label="폴더 앞으로"
                  disabled={gi === 0}
                  onClick={() => moveGroup(g.id, 'up')}
                  className="px-1 text-gray-500 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label="폴더 뒤로"
                  disabled={gi === groups.length - 1}
                  onClick={() => moveGroup(g.id, 'down')}
                  className="px-1 text-gray-500 disabled:opacity-30"
                >
                  ▼
                </button>
                <button
                  type="button"
                  aria-label="폴더 삭제"
                  onClick={() => {
                    if (members.length < 2 || window.confirm(`폴더 "${g.name}"와(과) 안의 레이어 ${members.length}장을 지울까요?`))
                      removeGroup(g.id)
                  }}
                  className="px-1 text-gray-400 hover:text-pink-600"
                >
                  ✕
                </button>
              </div>
              {!g.collapsed && (
                <ul className="px-2 pb-1 pl-6">
                  {members.map((l, i) => (
                    <li key={l.id} className="py-1 text-sm">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={l.enabled}
                          onChange={(e) => updateLayer(l.id, { enabled: e.target.checked })}
                        />
                        {/* 줄을 누르면 이 레이어만 따로 조절하는 팝업이 열림 */}
                        <button
                          type="button"
                          aria-label={`${l.name} 설정 열기`}
                          onClick={() => setOpenId(openId === l.id ? null : l.id)}
                          className={`flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-pink-50 ${
                            openId === l.id ? 'bg-pink-100 text-pink-700' : ''
                          }`}
                        >
                          <img src={l.src} alt="" draggable={false} className="h-7 w-7 shrink-0 rounded border border-pink-100 bg-white object-contain" />
                          <span className="min-w-0 flex-1 truncate">
                            {l.name}
                            {l.expression === 'normal' && <span className="ml-1 text-xs text-gray-400">(평소)</span>}
                            {l.expression === 'hit' && <span className="ml-1 text-xs text-pink-400">(밀림)</span>}
                          </span>
                          <span className="text-gray-400">⚙</span>
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
                          disabled={i === members.length - 1}
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
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
      {openLayer && (
        // 배경을 어둡게 하지 않는 떠 있는 팝업 — 설정하면서 흔들림을 볼 수 있음
        <div
          role="dialog"
          aria-label={`${openLayer.name} 설정`}
          className="fixed inset-x-2 bottom-2 z-50 max-h-[55vh] overflow-y-auto rounded-lg border border-pink-300 bg-white shadow-xl md:inset-x-auto md:bottom-auto md:left-4 md:top-4 md:max-h-[calc(100vh-2rem)] md:w-80"
        >
          <div className="sticky top-0 flex items-center justify-between border-b border-pink-100 bg-white px-3 py-2">
            <span className="min-w-0 truncate font-bold text-pink-600">{openLayer.name}</span>
            <button type="button" aria-label="팝업 닫기" onClick={() => setOpenId(null)} className="px-1 text-gray-500 hover:text-pink-600">
              ✕
            </button>
          </div>
          <LayerSettings layer={openLayer} frame={frame} onClose={() => setOpenId(null)} />
        </div>
      )}
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
        + 레이어 추가 (PNG 여러 장 선택 → 폴더 하나)
      </button>
      <p className="text-xs text-gray-400">
        한 번에 올린 이미지는 한 폴더로 묶여 같은 여백으로 함께 잘려요. 레이어 줄을 누르면 그 레이어만 따로 조절하는 팝업이 열려요.
      </p>
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={trim}
          onChange={(e) => setTrim(e.target.checked)}
          className="accent-pink-500"
        />
        투명 여백 자동으로 자르기
      </label>
      <p className="ml-6 text-xs text-gray-400">
        맨 처음 올린 폴더가 화면 크기의 기준이에요. 다른 폴더를 더해도 이미 올린 그림은 움직이지 않아요.
      </p>
    </section>
  )
}

export default LayerList
