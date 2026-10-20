import { useSwingStore } from '../store/useSwingStore'
import { characterColumn } from '../utils/layout'

/**
 * 위쪽 가로대 — 인원이 둘 이상일 때만 그림. 인원마다의 리본 끈은 캐릭터와 함께 흔들려야 해서
 * 여기가 아니라 Stage의 인원 묶음 안에서 그린다.
 */
function Ribbon() {
  const count = useSwingStore((s) => s.characters.length)
  const spacing = useSwingStore((s) => s.spacing)
  if (count < 2) return null
  const first = characterColumn(0, count, spacing).center
  const last = characterColumn(count - 1, count, spacing).center

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <line x1={`${first}%`} y1="3" x2={`${last}%`} y2="3" stroke="#f9a8d4" strokeWidth={6} strokeLinecap="round" />
    </svg>
  )
}

export default Ribbon
