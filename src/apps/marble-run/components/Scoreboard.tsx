import { useMarbleStore } from '../store/useMarbleStore'

/** 순위판: 골인한 순서대로 이름 + 등수. 새로 들어온 줄은 팝 애니메이션 */
function Scoreboard() {
  const order = useMarbleStore((s) => s.finishOrder)
  const characters = useMarbleStore((s) => s.characters)
  if (order.length === 0) return null

  return (
    <ol className="pointer-events-none absolute right-2 top-2 flex max-w-[45%] flex-col gap-1">
      {order.map((id, i) => {
        const c = characters.find((x) => x.id === id)
        if (!c) return null
        return (
          <li
            key={id}
            className="mr-pop flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-0.5 text-xs shadow"
            style={{ borderLeft: `4px solid ${c.color}` }}
          >
            <span className="font-bold text-pink-600">{i + 1}등</span>
            <span className="truncate text-gray-700">{c.name}</span>
          </li>
        )
      })}
    </ol>
  )
}

export default Scoreboard
