import Ribbon from './Ribbon'
import CharacterLayer from './CharacterLayer'
import PopEffect from './PopEffect'
import { useSwingLoop } from '../hooks/useSwingLoop'
import { useSwingStore } from '../store/useSwingStore'
import { characterColumn } from '../utils/layout'
import { layoutFor } from '../utils/frame'

function Stage() {
  useSwingLoop()
  const characters = useSwingStore((s) => s.characters)
  const layers = useSwingStore((s) => s.layers)
  const activeId = useSwingStore((s) => s.activeCharacterId)
  const setActive = useSwingStore((s) => s.setActiveCharacter)
  const popEffect = useSwingStore((s) => s.popEffect)
  const trim = useSwingStore((s) => s.trim)
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
      {characters.map((c, i) => {
        const charLayers = layers.filter((l) => l.characterId === c.id)
        const frame = layoutFor(charLayers, trim)
        return (
          // 인원 수만큼 가로로 분할. isolate: 인원별로 레이어 zIndex가 섞이지 않게 함
          <div
            key={c.id}
            className="isolate absolute top-0 h-full"
            style={{ left: `${columns[i].center - columns[i].width / 2}%`, width: `${columns[i].width}%` }}
            onClick={() => setActive(c.id)}
          >
            {/* 프레임: 레이어들의 내용 영역만큼의 박스. 모든 레이어가 이 박스 안에 겹쳐 그려짐 */}
            <div className="pointer-events-none absolute inset-x-0 top-20 flex h-[70%] justify-center">
              <div className="relative h-full" style={{ aspectRatio: frame.aspect }}>
                {charLayers.map((layer) => (
                  <CharacterLayer key={layer.id} layer={layer} frame={frame} />
                ))}
              </div>
            </div>
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
        )
      })}
    </div>
  )
}

export default Stage
