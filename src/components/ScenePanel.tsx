import { useState } from 'react'
import { useLibraryStore } from '../store/useLibraryStore'

/** 컨셉 탭 — 장면 전체(배경 + 리본 + 모든 인원의 레이어 구성 + 슬라이더 값)를 이름으로 저장하고 불러오기 */
function ScenePanel() {
  const scenes = useLibraryStore((s) => s.scenes)
  const saveScene = useLibraryStore((s) => s.saveScene)
  const applyScene = useLibraryStore((s) => s.applyScene)
  const deleteScene = useLibraryStore((s) => s.deleteScene)
  const [name, setName] = useState('')

  return (
    <section>
      <h2 className="mb-1 font-bold text-pink-600">컨셉 저장</h2>
      <p className="mb-3 text-xs text-gray-400">
        지금 화면을 통째로 저장해요: 배경, 리본 그림·길이, 모든 인원과 레이어(폴더 포함), 슬라이더 값. 커미션 한 건을
        그대로 다시 열 수 있어요. 같은 이름으로 저장하면 덮어써요.
      </p>
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          saveScene(name)
          setName('')
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예) 겨울 카페 컨셉"
          className="min-w-0 flex-1 rounded border border-pink-200 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded bg-pink-500 px-2 py-1 text-sm text-white disabled:opacity-40"
        >
          저장
        </button>
      </form>
      {scenes.length === 0 && <p className="text-sm text-gray-400">저장된 컨셉이 없습니다</p>}
      <ul>
        {scenes.map((s) => (
          <li key={s.id} className="flex items-center gap-2 py-1 text-sm">
            <span className="min-w-0 flex-1 truncate">{s.name}</span>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`컨셉 "${s.name}"을(를) 불러올까요?\n지금 화면은 이 컨셉으로 바뀌어요.`)) applyScene(s.id)
              }}
              className="text-pink-500 hover:text-pink-600"
            >
              불러오기
            </button>
            <button
              type="button"
              aria-label={`${s.name} 컨셉 삭제`}
              onClick={() => {
                if (window.confirm(`컨셉 "${s.name}"을(를) 삭제할까요?`)) deleteScene(s.id)
              }}
              className="px-1 text-gray-400 hover:text-pink-600"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ScenePanel
