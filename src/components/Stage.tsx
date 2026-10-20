import Ribbon from './Ribbon'
import CharacterLayer from './CharacterLayer'
import { useSwingLoop } from '../hooks/useSwingLoop'
import { useSwingStore } from '../store/useSwingStore'
import { characterColumn } from '../utils/layout'
import PopEffect from './PopEffect'

function Stage() {
  useSwingLoop()
  const characters = useSwingStore((s) => s.characters)
  const layers = useSwingStore((s) => s.layers)
  const activeId = useSwingStore((s) => s.activeCharacterId)
  const setActive = useSwingStore((s) => s.setActiveCharacter)
  const popEffect = useSwingStore((s) => s.popEffect)
  const spacing = useSwingStore((s) => s.spacing)
  const n = characters.length
  const columns = characters.map((_, i) => characterColumn(i, n, spacing))

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Ribbon />
      {layers.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center text-pink-400">
          캐릭터 PNG를 업로드해 보세요
        </p>
      )}
      {characters.map((c, i) => (
        // 인원 수만큼 가로로 균등 분할. isolate: 인원별로 레이어 zIndex가 섞이지 않게 함
        <div
          key={c.id}
          className="isolate absolute top-0 h-full"
          style={{ left: `${columns[i].center - columns[i].width / 2}%`, width: `${columns[i].width}%` }}
          onClick={() => setActive(c.id)}
        >
          {layers
            .filter((l) => l.characterId === c.id)
            .map((layer) => (
              <CharacterLayer key={layer.id} layer={layer} />
            ))}
          {/* key가 바뀔 때마다(=밀릴 때마다) 새로 마운트되어 애니메이션이 다시 시작됨 */}
          {popEffect && c.reactedAt > 0 && <PopEffect key={c.reactedAt} startAt={c.reactedAt} />}
          {n > 1 && (
            <span
              className={`absolute inset-x-0 bottom-2 z-[1000] flex justify-center whitespace-nowrap text-xs ${
                c.id === activeId ? 'font-bold text-pink-600' : 'text-gray-400'
              }`}
            >
              {c.name}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default Stage
