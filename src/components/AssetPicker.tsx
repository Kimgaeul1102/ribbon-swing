import { useRef } from 'react'
import { useLibraryStore } from '../store/useLibraryStore'
import type { AssetKind } from '../utils/assetDb'

type AssetPickerProps = {
  kind: Exclude<AssetKind, 'layer'>
  selectedId: string | null
  onSelect: (id: string | null) => void
  uploadLabel: string
  noneLabel: string
}

/** 리본/배경 그림 고르기 — 한 번 올린 그림은 보관함에 저장돼서 썸네일을 눌러 다시 쓸 수 있다 */
function AssetPicker({ kind, selectedId, onSelect, uploadLabel, noneLabel }: AssetPickerProps) {
  const assets = useLibraryStore((s) => s.assets).filter((a) => a.kind === kind)
  const uploadImages = useLibraryStore((s) => s.uploadImages)
  const removeAsset = useLibraryStore((s) => s.removeAsset)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          const [first] = await uploadImages(files, kind)
          if (first) onSelect(first.id) // 올리자마자 바로 적용
        }}
      />
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm text-pink-500 hover:text-pink-600"
        >
          {uploadLabel}
        </button>
        {selectedId && (
          <button type="button" onClick={() => onSelect(null)} className="text-xs text-gray-500 hover:text-pink-600">
            {noneLabel}
          </button>
        )}
      </div>
      {assets.length === 0 ? (
        <p className="text-xs text-gray-400">올린 그림이 여기에 저장돼요</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {assets.map((a) => (
            <li key={a.id} className="group relative">
              <button
                type="button"
                title={a.name}
                onClick={() => onSelect(a.id)}
                className={`block w-full rounded border p-1 ${
                  a.id === selectedId ? 'border-pink-500 bg-pink-100' : 'border-pink-100 bg-pink-50 hover:border-pink-400'
                }`}
              >
                <img src={a.url} alt={a.name} draggable={false} className="h-16 w-full object-contain" />
              </button>
              <button
                type="button"
                aria-label={`${a.name} 보관함에서 삭제`}
                onClick={() => {
                  if (window.confirm(`"${a.name}"을(를) 보관함에서 삭제할까요?`)) removeAsset(a.id)
                }}
                className="absolute right-0 top-0 hidden rounded-bl bg-white/90 px-1 text-xs text-gray-500 hover:text-pink-600 group-hover:block"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AssetPicker
