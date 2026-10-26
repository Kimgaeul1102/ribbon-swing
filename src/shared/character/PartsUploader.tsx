import { useState } from 'react'
import ExtraLayersEditor from './ExtraLayersEditor'
import { MAX_CHARACTERS, useCharacterStore } from './useCharacterStore'
import { PART_LABELS, PART_NAMES, type CharacterData } from './types'

/** 캐릭터 한 명의 그림 올리기: 여러 장 한 번에(이름이 맞으면 해당 파츠, 아니면 흔들림 레이어) 또는 파츠별로 */
function PartsUploader({ character }: { character: CharacterData }) {
  const assignFiles = useCharacterStore((s) => s.assignFiles)
  const setPartFile = useCharacterStore((s) => s.setPartFile)
  const [notice, setNotice] = useState('')
  const empty = PART_NAMES.every((p) => !character.parts[p]) && character.extras.length === 0

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const extras = assignFiles(character.id, Array.from(files))
    setNotice(extras > 0 ? `${extras}장은 이름이 파츠 이름과 달라서 "흔들릴 부분 레이어"로 들어갔어요. 아래에서 강도를 조절하세요.` : '')
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-2 block cursor-pointer rounded-lg border border-dashed border-pink-300 py-2 text-center text-sm text-pink-600 hover:bg-pink-50">
          캐릭터 PNG 한 번에 올리기
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
        <p className="mb-2 text-xs text-gray-500">
          파일 이름이 body.png, head.png, hair.png, eyes_open.png, eyes_closed.png, mouth.png, hand_l.png, hand_r.png 이면 해당 칸에 자동으로 들어가요. 이름이 다른 파일은 흔들릴 부분 레이어가 돼요. 아래 칸을 눌러 하나씩 넣어도 돼요.
        </p>
        {notice && <p className="mb-2 text-xs text-pink-600">{notice}</p>}
        <div className="grid grid-cols-2 gap-1.5">
          {PART_NAMES.map((p) => {
            const has = !!character.parts[p]
            return (
              <div key={p} className={`flex items-center justify-between rounded border px-2 py-1 text-xs ${has ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-pink-100 text-gray-500'}`}>
                <label className="flex-1 cursor-pointer">
                  {has ? '✓ ' : ''}
                  {PART_LABELS[p]}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) setPartFile(character.id, p, f)
                      e.target.value = ''
                    }}
                  />
                </label>
                {has && (
                  <button type="button" aria-label={`${PART_LABELS[p]} 빼기`} onClick={() => setPartFile(character.id, p, null)} className="text-gray-400 hover:text-red-500">
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
        {empty && <p className="mt-2 text-xs text-gray-500">아직 안 올려서 임시 캐릭터로 보여주고 있어요.</p>}
        {!empty && <p className="mt-2 text-xs text-gray-500">올린 그림은 이 브라우저에 저장돼서 새로고침해도 남아요. (서버로 보내지 않아요)</p>}
      </div>
      <ExtraLayersEditor character={character} />
    </div>
  )
}

/** 앱에서 캐릭터 한 명만 쓸 때 */
export function SingleCharacterUploader() {
  const character = useCharacterStore((s) => s.characters[0])
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-pink-600">캐릭터 그림</h2>
      <PartsUploader character={character} />
    </section>
  )
}

/** 여러 명(병조림 선반, 택배 박스): 캐릭터 추가/삭제/이름 + 각자 그림 */
export function CharacterRoster() {
  const characters = useCharacterStore((s) => s.characters)
  const add = useCharacterStore((s) => s.addCharacter)
  const remove = useCharacterStore((s) => s.removeCharacter)
  const rename = useCharacterStore((s) => s.renameCharacter)
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-pink-600">캐릭터 (최대 {MAX_CHARACTERS}명)</h2>
      <ul className="flex flex-col gap-2">
        {characters.map((c) => (
          <li key={c.id} className="rounded-lg border border-pink-100 p-2">
            <div className="flex items-center gap-2">
              <input value={c.name} onChange={(e) => rename(c.id, e.target.value)} className="min-w-0 flex-1 rounded border border-pink-200 bg-white px-2 py-1 text-sm" />
              <button type="button" onClick={() => setOpenId(openId === c.id ? null : c.id)} className="text-xs text-pink-600">
                {openId === c.id ? '접기' : '그림'}
              </button>
              <button type="button" disabled={characters.length <= 1} onClick={() => remove(c.id)} aria-label={`${c.name} 빼기`} className="text-sm text-gray-400 hover:text-red-500 disabled:opacity-30">
                ✕
              </button>
            </div>
            {openId === c.id && (
              <div className="mt-2">
                <PartsUploader character={c} />
              </div>
            )}
          </li>
        ))}
      </ul>
      <button type="button" disabled={characters.length >= MAX_CHARACTERS} onClick={add} className="mt-2 w-full rounded-lg border border-dashed border-pink-300 py-2 text-sm text-pink-600 hover:bg-pink-50 disabled:opacity-40">
        + 캐릭터 추가
      </button>
    </section>
  )
}
