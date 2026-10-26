import { useEffect, useRef, type ReactNode } from 'react'
import BackToHome from '../BackToHome'
import LoopControls from './LoopControls'
import { useLoopPlayer, type DrawFn } from './useLoopPlayer'
import { useLoopSettings } from './useLoopSettings'

type Props = {
  title: string
  emoji: string
  draw: DrawFn
  /** 오른쪽 패널에 들어갈 앱별 설정 */
  children: ReactNode
}

/** 사진을 올려 만드는 움짤 앱의 공통 화면: 왼쪽 캔버스(투명 배경은 체크무늬로 표시) + 오른쪽 컨트롤 (모바일은 하단 시트) */
function AppShell({ title, emoji, draw, children }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const player = useLoopPlayer(canvasRef, draw)
  const stageW = useLoopSettings((s) => s.stageW)
  const stageH = useLoopSettings((s) => s.stageH)

  // ← → 로 프레임 이동 (입력창에 글자 칠 때는 무시)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') player.step(-1)
      if (e.key === 'ArrowRight') player.step(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [player])

  return (
    <div className="flex h-full flex-col md:flex-row">
      <main className="relative flex min-h-0 flex-1 items-center justify-center bg-pink-50 p-3">
        <canvas
          ref={canvasRef}
          width={stageW}
          height={stageH}
          className="max-h-full max-w-full rounded-lg border border-pink-200 shadow"
          style={{
            aspectRatio: `${stageW} / ${stageH}`,
            backgroundColor: '#fff',
            backgroundImage: 'conic-gradient(#e5e7eb 25%, transparent 0 50%, #e5e7eb 0 75%, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />
      </main>
      <aside className="flex max-h-[50%] w-full flex-col border-t border-pink-200 bg-white md:max-h-none md:w-80 md:border-l md:border-t-0">
        <div className="border-b border-pink-100 p-3">
          <div className="mb-2 flex items-center justify-between">
            <BackToHome />
            <span className="text-sm font-bold text-pink-600">
              {emoji} {title}
            </span>
          </div>
          <LoopControls player={player} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  )
}

export default AppShell
