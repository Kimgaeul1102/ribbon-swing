import { MAX_CHARACTERS, useMarbleStore } from '../store/useMarbleStore'

/** 참가 캐릭터: 원형 PNG 올리기 / 이름 바꾸기 / 빼기. 이미지는 브라우저 안에서만 쓰임(서버 전송 없음) */
function CharacterList() {
  const characters = useMarbleStore((s) => s.characters)
  const add = useMarbleStore((s) => s.addCharacters)
  const rename = useMarbleStore((s) => s.renameCharacter)
  const remove = useMarbleStore((s) => s.removeCharacter)

  const onFiles = (files: FileList | null) => {
    if (!files) return
    add(
      Array.from(files).map((f) => ({
        name: f.name.replace(/\.[^.]+$/, ''),
        src: URL.createObjectURL(f),
      })),
    )
  }

  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-pink-600">참가 캐릭터</h2>
      <ul className="mb-2 flex flex-col gap-1.5">
        {characters.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            <span
              className="h-7 w-7 shrink-0 rounded-full border-2 bg-cover bg-center"
              style={{ borderColor: c.color, backgroundColor: c.color, backgroundImage: c.src ? `url(${c.src})` : undefined }}
            />
            <input
              value={c.name}
              onChange={(e) => rename(c.id, e.target.value)}
              className="min-w-0 flex-1 rounded border border-pink-200 bg-white px-2 py-1 text-sm"
            />
            <button
              type="button"
              disabled={characters.length <= 1}
              onClick={() => remove(c.id)}
              className="text-sm text-gray-400 hover:text-red-500 disabled:opacity-30"
              aria-label={`${c.name} 빼기`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <label className="block cursor-pointer rounded-lg border border-dashed border-pink-300 py-2 text-center text-sm text-pink-600 hover:bg-pink-50">
        + 캐릭터 그림 올리기 (최대 {MAX_CHARACTERS}명)
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            onFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </label>
    </section>
  )
}

export default CharacterList
