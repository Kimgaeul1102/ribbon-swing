import { useState } from 'react'
import { useLibraryStore } from '../store/useLibraryStore'

/** 보관함(한 번 올린 이미지 재사용) + 저장된 세트(레이어 구성/설정 통째로 저장·불러오기) */
function LibraryPanel() {
  const assets = useLibraryStore((s) => s.assets)
  const sets = useLibraryStore((s) => s.sets)
  const addLayerFromAsset = useLibraryStore((s) => s.addLayerFromAsset)
  const removeAsset = useLibraryStore((s) => s.removeAsset)
  const saveSet = useLibraryStore((s) => s.saveSet)
  const applySet = useLibraryStore((s) => s.applySet)
  const deleteSet = useLibraryStore((s) => s.deleteSet)
  const [setName, setSetName] = useState('')

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-1 font-bold text-pink-600">보관함</h2>
        <p className="mb-3 text-xs text-gray-400">한 번 올린 이미지는 저장돼요. 눌러서 다시 추가!</p>
        {assets.length === 0 && <p className="text-sm text-gray-400">비어 있습니다</p>}
        <ul className="grid grid-cols-3 gap-2">
          {assets.map((a) => (
            <li key={a.id} className="group relative">
              <button
                type="button"
                title={`${a.name} — 눌러서 레이어로 추가`}
                onClick={() => addLayerFromAsset(a.id)}
                className="block w-full rounded border border-pink-100 bg-pink-50 p-1 hover:border-pink-400"
              >
                <img src={a.url} alt={a.name} draggable={false} className="h-16 w-full object-contain" />
                <span className="block truncate text-center text-[10px] text-gray-500">{a.name}</span>
              </button>
              <button
                type="button"
                aria-label={`${a.name} 보관함에서 삭제`}
                onClick={() => {
                  if (window.confirm(`"${a.name}"을(를) 보관함에서 삭제할까요?\n현재 화면의 해당 레이어도 함께 제거됩니다.`))
                    removeAsset(a.id)
                }}
                className="absolute right-0 top-0 hidden rounded-bl bg-white/90 px-1 text-xs text-gray-500 hover:text-pink-600 group-hover:block"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="mb-1 font-bold text-pink-600">저장된 세트</h2>
        <p className="mb-3 text-xs text-gray-400">선택한 인원의 레이어 구성(순서·설정)을 이름으로 저장해요. 불러오면 선택한 인원의 레이어가 교체돼요.</p>
        <form
          className="mb-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            saveSet(setName)
            setSetName('')
          }}
        >
          <input
            value={setName}
            onChange={(e) => setSetName(e.target.value)}
            placeholder="예) 홍길동 여름옷"
            className="min-w-0 flex-1 rounded border border-pink-200 px-2 py-1 text-sm"
          />
          <button
            type="submit"
            disabled={!setName.trim()}
            className="rounded bg-pink-500 px-2 py-1 text-sm text-white disabled:opacity-40"
          >
            저장
          </button>
        </form>
        {sets.length === 0 && <p className="text-sm text-gray-400">저장된 세트가 없습니다</p>}
        <ul>
          {sets.map((s) => (
            <li key={s.id} className="flex items-center gap-2 py-1 text-sm">
              <span className="min-w-0 flex-1 truncate">{s.name}</span>
              <button type="button" onClick={() => applySet(s.id)} className="text-pink-500 hover:text-pink-600">
                불러오기
              </button>
              <button
                type="button"
                aria-label={`${s.name} 세트 삭제`}
                onClick={() => {
                  if (window.confirm(`세트 "${s.name}"을(를) 삭제할까요?`)) deleteSet(s.id)
                }}
                className="px-1 text-gray-400 hover:text-pink-600"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

export default LibraryPanel
