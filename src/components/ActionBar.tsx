import { useSwingStore } from '../store/useSwingStore'
import { setCook } from '../utils/fire'

/** 어느 탭에서든 바로 쓰는 버튼 — 밀기(차례대로/한번에), 계속 흔들기, 멈추기, 불 붙이기 */
function ActionBar() {
  const idleOn = useSwingStore((s) => s.idleOn)
  const pushSequential = useSwingStore((s) => s.pushSequential)
  const pushAll = useSwingStore((s) => s.pushAll)
  const setIdleOn = useSwingStore((s) => s.setIdleOn)
  const stop = useSwingStore((s) => s.stop)
  const fireOn = useSwingStore((s) => s.fireOn)
  const setFireOn = useSwingStore((s) => s.setFireOn)

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={pushSequential}
        title="1번 → 2번 → 3번… 순서로 밀려요"
        className="rounded bg-pink-500 py-1.5 text-sm text-white hover:bg-pink-600"
      >
        차례대로 밀기
      </button>
      <button
        type="button"
        onClick={pushAll}
        className="rounded bg-pink-500 py-1.5 text-sm text-white hover:bg-pink-600"
      >
        한번에 밀기
      </button>
      <button
        type="button"
        aria-pressed={idleOn}
        onClick={() => setIdleOn(!idleOn)}
        className={`rounded border py-1.5 text-sm ${
          idleOn
            ? 'border-pink-500 bg-pink-100 text-pink-700 hover:bg-pink-200'
            : 'border-pink-400 text-pink-500 hover:bg-pink-50'
        }`}
      >
        {idleOn ? '계속 흔들기 끄기' : '계속 흔들기'}
      </button>
      <button
        type="button"
        onClick={stop}
        className="rounded border border-gray-300 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
      >
        멈추기
      </button>
      <button
        type="button"
        aria-pressed={fireOn}
        onClick={() => setFireOn(!fireOn)}
        title="켜 두면 매달린 인원이 서서히 익어요"
        className={`rounded border py-1.5 text-sm ${
          fireOn
            ? 'border-orange-500 bg-orange-100 text-orange-700 hover:bg-orange-200'
            : 'border-orange-400 text-orange-500 hover:bg-orange-50'
        }`}
      >
        {fireOn ? '🔥 불 끄기' : '🔥 불 붙이기'}
      </button>
      <button
        type="button"
        onClick={() => setCook(0)}
        title="익은 정도를 처음으로"
        className="rounded border border-gray-300 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
      >
        생으로 되돌리기
      </button>
    </div>
  )
}

export default ActionBar
