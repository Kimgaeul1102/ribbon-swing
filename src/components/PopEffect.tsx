import { useState, type CSSProperties } from 'react'
import { useSwingStore } from '../store/useSwingStore'
import { POP_BUBBLE, POP_DURATION_MS, POP_PARTICLES, type PopParticle } from '../utils/popParticles'

type PopEffectProps = {
  attachY: number // 끈이 달린 높이 (그림 높이 비율) — 머리 위치를 따라가려고 씀
  startAt: number // 밀리는 시각 (performance.now, ms) — 차례대로 밀기에서는 미래일 수 있음
}

/** 뿅뿅 효과 — 캐릭터 머리 근처에서 "뿅!"과 반짝이 조각이 튀어나옴 (값은 utils/popParticles.ts와 영상 저장이 같이 씀) */
function PopEffect({ startAt, attachY }: PopEffectProps) {
  const ribbonLength = useSwingStore((s) => s.ribbonLength)
  // 마운트 시점에 한 번만 계산 (이후 리렌더로 애니메이션이 다시 시작되지 않게)
  const [wait] = useState(() => Math.max(0, startAt - performance.now()))

  const style = (p: PopParticle): CSSProperties =>
    ({
      '--dx': `${p.dx}px`,
      '--dy': `${p.dy}px`,
      position: 'absolute',
      left: 0,
      top: 0,
      opacity: 0,
      animation: `pop-burst ${POP_DURATION_MS / 1000}s ease-out ${wait + p.delay}ms both`,
      fontSize: `${p.size}rem`,
      color: p.color,
      ...(p.bold ? { fontWeight: 800, whiteSpace: 'nowrap' } : {}),
    }) as CSSProperties

  return (
    <div
      className="pointer-events-none absolute left-1/2 z-[999]"
      style={{ top: `calc(${ribbonLength}px - ${attachY * 70}% + 8%)` }}
      aria-hidden
    >
      <span style={style(POP_BUBBLE)}>{POP_BUBBLE.glyph}</span>
      {POP_PARTICLES.map((p, i) => (
        <span key={i} style={style(p)}>
          {p.glyph}
        </span>
      ))}
    </div>
  )
}

export default PopEffect
