import { create } from 'zustand'
import { deleteValue, extraKey, getValue, META_KEY, partKey, persistAvailable, putValue, type SavedCharacter } from './persist'
import { PART_NAMES, type CharacterData, type ExtraLayer, type PartName } from './types'

export const MAX_CHARACTERS = 6

export const DEFAULT_EXTRA = { strength: 1.5, lag: 0.15, speed: 1, pivotX: 0.5, pivotY: 0.15, behind: false }

type CharacterState = {
  characters: CharacterData[]
  addCharacter: () => void
  removeCharacter: (id: string) => void
  renameCharacter: (id: string, name: string) => void
  /** 기본 파츠(body, hair …)에 그림을 넣거나(file) 뺌(null) */
  setPartFile: (id: string, part: PartName, file: File | null) => void
  /** 파일 이름이 파츠 이름(body.png …)과 맞으면 그 파츠로, 아니면 흔들림 레이어로 추가. 흔들림 레이어로 들어간 개수를 돌려줌 */
  assignFiles: (id: string, files: File[]) => number
  addExtras: (id: string, files: File[]) => void
  updateExtra: (id: string, extraId: string, patch: Partial<Omit<ExtraLayer, 'id' | 'url'>>) => void
  removeExtra: (id: string, extraId: string) => void
  setHairSway: (id: string, v: number) => void
}

let counter = 1
const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${(counter += 1)}`

/** 파일 이름에서 파츠 이름 추측: 확장자 제거, 소문자, '-'/' '는 '_'로 */
export function detectPart(filename: string): PartName | null {
  const base = filename.replace(/\.[^.]+$/, '').toLowerCase().replace(/[-\s]+/g, '_')
  return (PART_NAMES as readonly string[]).includes(base) ? (base as PartName) : null
}

const blankCharacter = (id: string, name: string): CharacterData => ({ id, name, parts: {}, extras: [], hairSway: 0 })

const mapChar = (s: CharacterState, id: string, fn: (c: CharacterData) => CharacterData) => s.characters.map((c) => (c.id === id ? fn(c) : c))

export const useCharacterStore = create<CharacterState>((set, get) => {
  const find = (id: string) => get().characters.find((c) => c.id === id)

  const addExtraFile = (id: string, file: File) => {
    const extraId = uid('x')
    const extra: ExtraLayer = { ...DEFAULT_EXTRA, id: extraId, name: file.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(file) }
    set((s) => ({ characters: mapChar(s, id, (c) => ({ ...c, extras: [...c.extras, extra] })) }))
    void putValue(extraKey(id, extraId), file)
  }

  return {
    characters: [blankCharacter('c1', '캐릭터 1')],
    addCharacter: () =>
      set((s) => (s.characters.length >= MAX_CHARACTERS ? s : { characters: [...s.characters, blankCharacter(uid('c'), `캐릭터 ${s.characters.length + 1}`)] })),
    removeCharacter: (id) => {
      const c = find(id)
      if (!c || get().characters.length <= 1) return
      for (const p of PART_NAMES) if (c.parts[p]) void deleteValue(partKey(id, p))
      for (const x of c.extras) void deleteValue(extraKey(id, x.id))
      set((s) => ({ characters: s.characters.filter((x) => x.id !== id) }))
    },
    renameCharacter: (id, name) => set((s) => ({ characters: mapChar(s, id, (c) => ({ ...c, name })) })),
    setPartFile: (id, part, file) => {
      set((s) => ({
        characters: mapChar(s, id, (c) => {
          const parts = { ...c.parts }
          if (file) parts[part] = URL.createObjectURL(file)
          else delete parts[part]
          return { ...c, parts }
        }),
      }))
      if (file) void putValue(partKey(id, part), file)
      else void deleteValue(partKey(id, part))
    },
    assignFiles: (id, files) => {
      let extras = 0
      for (const f of files) {
        const part = detectPart(f.name)
        if (part) get().setPartFile(id, part, f)
        else {
          addExtraFile(id, f)
          extras += 1
        }
      }
      return extras
    },
    addExtras: (id, files) => files.forEach((f) => addExtraFile(id, f)),
    updateExtra: (id, extraId, patch) =>
      set((s) => ({ characters: mapChar(s, id, (c) => ({ ...c, extras: c.extras.map((x) => (x.id === extraId ? { ...x, ...patch } : x)) })) })),
    removeExtra: (id, extraId) => {
      set((s) => ({ characters: mapChar(s, id, (c) => ({ ...c, extras: c.extras.filter((x) => x.id !== extraId) })) }))
      void deleteValue(extraKey(id, extraId))
    },
    setHairSway: (id, v) => set((s) => ({ characters: mapChar(s, id, (c) => ({ ...c, hairSway: v })) })),
  }
})

/** 저장된 캐릭터를 불러옴: 설정(meta) + 그림 파일(Blob)에서 object URL을 다시 만듦 */
async function hydrate() {
  const meta = await getValue<SavedCharacter[]>(META_KEY)
  if (!meta || meta.length === 0) return
  const characters: CharacterData[] = []
  for (const sc of meta) {
    const parts: CharacterData['parts'] = {}
    for (const p of sc.parts) {
      const blob = await getValue<Blob>(partKey(sc.id, p))
      if (blob) parts[p] = URL.createObjectURL(blob)
    }
    const extras: ExtraLayer[] = []
    for (const x of sc.extras) {
      const blob = await getValue<Blob>(extraKey(sc.id, x.id))
      if (blob) extras.push({ ...DEFAULT_EXTRA, ...x, url: URL.createObjectURL(blob) })
    }
    characters.push({ id: sc.id, name: sc.name, parts, extras, hairSway: sc.hairSway ?? 0 })
  }
  useCharacterStore.setState({ characters })
}

const toSaved = (cs: CharacterData[]): SavedCharacter[] =>
  cs.map((c) => ({
    id: c.id,
    name: c.name,
    parts: PART_NAMES.filter((p) => c.parts[p]),
    extras: c.extras.map(({ url: _url, ...rest }) => rest),
    hairSway: c.hairSway,
  }))

/** 불러오기가 끝난 뒤부터 변경이 생길 때마다 (0.3초 모아서) 설정을 저장 */
if (persistAvailable()) {
  void hydrate().finally(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    useCharacterStore.subscribe((state) => {
      clearTimeout(timer)
      timer = setTimeout(() => void putValue(META_KEY, toSaved(state.characters)), 300)
    })
  })
}
