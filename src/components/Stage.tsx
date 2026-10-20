import Ribbon from './Ribbon'
import CharacterLayer from './CharacterLayer'
import PopEffect from './PopEffect'
import { useSwingLoop } from '../hooks/useSwingLoop'
import { useSwingStore } from '../store/useSwingStore'
import { characterColumn } from '../utils/layout'
import { layoutFor } from '../utils/frame'
import { ribbonElements } from '../utils/layerElements'

function Stage() {
  useSwingLoop()
  const characters = useSwingStore((s) => s.characters)
  const layers = useSwingStore((s) => s.layers)
  const activeId = useSwingStore((s) => s.activeCharacterId)
  const setActive = useSwingStore((s) => s.setActiveCharacter)
  const popEffect = useSwingStore((s) => s.popEffect)
  const trim = useSwingStore((s) => s.trim)
  const spacing = useSwingStore((s) => s.spacing)
  const zoom = useSwingStore((s) => s.zoom)
  const ribbonLength = useSwingStore((s) => s.ribbonLength)
  const n = characters.length
  const columns = characters.map((_, i) => characterColumn(i, n, spacing))

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* 배경은 이 바깥(Stage 바로 아래)에 두면 줌의 영향을 받지 않음. 아래 묶음이 줌(위쪽 중앙 기준)을 받음 */}
      <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: '50% 0' }}>
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
              {/* 리본 끈 + 캐릭터 묶음: 위쪽 가로대(상단 중앙) 기준으로 회전 → 끈이 매달린 채 흔들리고 캐릭터는 끈 끝에서 호를 그림 */}
              <div
                ref={(el) => {
                  if (el) ribbonElements.set(c.id, el)
                  else ribbonElements.delete(c.id)
                }}
                className="pointer-events-none absolute inset-0"
                style={{ transformOrigin: '50% 0', willChange: 'transform' }}
              >
                <div
                  className="absolute left-1/2 top-0 w-1.5 -translate-x-1/2 rounded-full bg-pink-500"
                  style={{ height: ribbonLength }}
                />
                {/* 프레임: 레이어들의 내용 영역만큼의 박스. 모든 레이어가 이 박스 안에 겹쳐 그려짐.
                    끈 끝이 그림의 attachY 높이에 닿도록 위로 올려 둠(0=정수리가 끈 끝). 끈 길이를 바꿔도 크기는 그대로 (크기는 줌으로 조절) */}
                <div
                  className="absolute inset-x-0 flex h-[70%] justify-center"
                  style={{ top: `calc(${ribbonLength}px - ${c.attachY * 70}%)` }}
                >
                  <div className="relative h-full" style={{ aspectRatio: frame.aspect }}>
                    {charLayers.map((layer) => (
                      <CharacterLayer key={layer.id} layer={layer} frame={frame} />
                    ))}
                  </div>
                </div>
              </div>
              {/* key가 바뀔 때마다(=밀릴 때마다) 새로 마운트되어 애니메이션이 다시 시작됨 */}
              {popEffect && c.reactedAt > 0 && <PopEffect key={c.reactedAt} startAt={c.reactedAt} attachY={c.attachY} />}
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
    </div>
  )
}

export default Stage
