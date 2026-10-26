import { useSwingStore } from '../store/useSwingStore'
import { characterColumn } from '../utils/layout'
import RopeCord from './RopeCord'

/**
 * 위쪽 가로대 — 인원이 둘 이상일 때만 그림. 인원마다의 리본 끈은 캐릭터와 함께 흔들려야 해서
 * 여기가 아니라 Stage의 인원 묶음 안에서 그린다.
 */
function Ribbon() {
  const count = useSwingStore((s) => s.characters.length)
  const spacing = useSwingStore((s) => s.spacing)
  const ribbonWidth = useSwingStore((s) => s.ribbonWidth)
  if (count < 2) return null
  const first = characterColumn(0, count, spacing).center
  const last = characterColumn(count - 1, count, spacing).center

  // 양 끝이 첫/마지막 인원의 끈 위치에 딱 맞도록 굵기의 절반씩 바깥으로 늘림 (export/renderScene.ts와 같은 규칙)
  return (
    <RopeCord
      horizontal
      className="pointer-events-none absolute"
      style={{
        left: `calc(${first}% - ${ribbonWidth / 2}px)`,
        width: `calc(${last - first}% + ${ribbonWidth}px)`,
        top: 0,
        height: ribbonWidth,
      }}
    />
  )
}

export default Ribbon
