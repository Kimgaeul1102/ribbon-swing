import { useSwingStore } from '../store/useSwingStore'
import { characterColumn } from '../utils/layout'

/** 리본 SVG — 위쪽 가로 레일에서 인원마다 리본이 한 줄씩 내려옴 (끝점 y=80은 캐릭터 pivot 위치) */
function Ribbon() {
  const count = useSwingStore((s) => s.characters.length)
  const spacing = useSwingStore((s) => s.spacing)
  const centers = Array.from({ length: count }, (_, i) => characterColumn(i, count, spacing).center)

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      {count > 1 && (
        <line
          x1={`${centers[0]}%`}
          y1="3"
          x2={`${centers[count - 1]}%`}
          y2="3"
          stroke="#f9a8d4"
          strokeWidth={6}
          strokeLinecap="round"
        />
      )}
      {centers.map((x, i) => (
        <line key={i} x1={`${x}%`} y1="0" x2={`${x}%`} y2="80" stroke="#ec4899" strokeWidth={6} strokeLinecap="round" />
      ))}
    </svg>
  )
}

export default Ribbon
