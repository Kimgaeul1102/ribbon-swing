import { useState, type CSSProperties } from 'react'
import { useSwingStore } from '../store/useSwingStore'

type PopEffectProps = {
  attachY: number // 끈이 달린 높이 (그림 높이 비율) — 머리 위치를 따라가려고 씀
  startAt: number // 밀리는 시각 (performance.now, ms) — 차례대로 밀기에서는 미래일 수 있음
}

const GLYPHS = ['✦', '♥', '★', '♪', '✿', '♥', '✦', '★']
const COLORS = ['#ec4899', '#f472b6', '#fb923c', '#facc15', '#a78bfa']

// 가운데에서 사방으로 퍼지는 조각들 (각도·거리는 고정값이라 매번 같은 움짤이 나옴)
const PARTICLES = GLYPHS.map((glyph, i) => {
  const angle = (i / GLYPHS.length) * Math.PI * 2 - Math.PI / 2
  const radius = i % 2 === 0 ? 90 : 65
  return {
    glyph,
    dx: Math.round(Math.cos(angle) * radius),
    dy: Math.round(Math.sin(angle) * radius),
    color: COLORS[i % COLORS.length],
    delay: (i % 3) * 40,
  }
})

/** 뿅뿅 효과 — 캐릭터 머리 근처에서 "뿅!"과 반짝이 조각이 튀어나옴 */
function PopEffect({ startAt, attachY }: PopEffectProps) {
  // 마운트 시점에 한 번만 계산 (이후 리렌더로 애니메이션이 다시 시작되지 않게)
  const ribbonLength = useSwingStore((s) => s.ribbonLength)
  const [wait] = useState(() => Math.max(0, startAt - performance.now()))

  const style = (dx: number, dy: number, delay: number, extra?: CSSProperties): CSSProperties => ({
    '--dx': `${dx}px`,
    '--dy': `${dy}px`,
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0,
    animation: `pop-burst 0.9s ease-out ${wait + delay}ms both`,
    ...extra,
  } as CSSProperties)

  return (
    <div className="pointer-events-none absolute left-1/2 z-[999]" style={{ top: `calc(${ribbonLength}px - ${attachY * 70}% + 8%)` }} aria-hidden>
      <span style={style(0, -60, 0, { fontSize: '1.6rem', fontWeight: 800, color: '#ec4899', whiteSpace: 'nowrap' })}>
        뿅!
      </span>
      {PARTICLES.map((p, i) => (
        <span key={i} style={style(p.dx, p.dy, p.delay, { fontSize: '1.2rem', color: p.color })}>
          {p.glyph}
        </span>
      ))}
    </div>
  )
}

export default PopEffect
