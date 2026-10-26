import { makeRng } from '../sim/rng'

export type ConfettiPiece = { x: number; y: number; color: string; size: number; spin: number }

const COLORS = ['#f472b6', '#60a5fa', '#facc15', '#34d399', '#a78bfa', '#fb923c']

type Seed = { x0: number; vx: number; vy: number; delay: number; color: string; size: number; spin: number }

/** 색종이 초기값 (seed로만 결정 → 같은 seed면 같은 모양) */
export function makeConfettiSeeds(seed: number, count: number, viewW: number): Seed[] {
  const rng = makeRng(seed * 7919 + 13)
  return Array.from({ length: count }, () => ({
    x0: rng() * viewW,
    vx: (rng() - 0.5) * 60,
    vy: 40 + rng() * 80,
    delay: rng() * 1.2,
    color: COLORS[Math.floor(rng() * COLORS.length)],
    size: 5 + rng() * 6,
    spin: (rng() - 0.5) * 12,
  }))
}

/** t초 시점의 색종이 위치 (위에서 떨어지며 살랑거림). 시간만으로 정해지는 순수 함수 */
export function confettiAt(seeds: Seed[], t: number): ConfettiPiece[] {
  const out: ConfettiPiece[] = []
  for (const s of seeds) {
    const local = t - s.delay
    if (local < 0) continue
    out.push({
      x: s.x0 + s.vx * local + Math.sin(local * 3 + s.x0) * 14,
      y: -20 + s.vy * local + 90 * local * local * 0.5,
      color: s.color,
      size: s.size,
      spin: s.spin * local,
    })
  }
  return out
}
