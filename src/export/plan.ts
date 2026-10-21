import { createSimulation, type SimInput } from '../sim/swingSim'

/** 저장할 때 밀기 전에 가만히 있는 시간 (ms) — GIF가 반복될 때 자연스럽게 이어지도록 */
export const EXPORT_LEAD_MS = 150
/** 흔들림이 가라앉은 뒤 마지막 모습을 보여주는 시간 (초) */
export const EXPORT_TAIL_SEC = 0.3
/** 이 각도(deg)보다 작게 흔들리면 가라앉은 것으로 봄 */
export const SETTLE_DEG = 1
/** 가라앉은 상태가 이만큼 이어져야 끝난 것으로 봄 (초) */
const SETTLE_HOLD_SEC = 0.25
const MIN_SECONDS = 1

export type PushMode = 'all' | 'sequential'

type ExportBase = Omit<SimInput, 'idleOn' | 'stopAt' | 'characters'> & {
  pushGap: number
  characters: { id: string }[]
}

/**
 * 저장용 입력 — 한 번 밀기만 담는다 (계속 흔들기는 끝이 없어서 뺌).
 * 시간은 영상 처음을 0으로 하는 가상 시간이고, 밀기는 EXPORT_LEAD_MS 뒤에 시작한다.
 * 차례대로 밀기는 인원마다 pushGap초씩 늦게 시작한다.
 */
export function buildExportInput(base: ExportBase, push: PushMode): SimInput {
  return {
    ...base,
    idleOn: false,
    stopAt: 0,
    characters: base.characters.map((c, i) => {
      const at = EXPORT_LEAD_MS + (push === 'sequential' ? i * base.pushGap * 1000 : 0)
      return { id: c.id, swingStartedAt: at, reactedAt: at }
    }),
  }
}

export type Plan = {
  seconds: number // 영상 길이
  capped: boolean // 최대 길이까지 흔들림이 안 끝나서 잘렸는지
}

/**
 * "한 번 흔들림이 끝나는" 시점까지의 길이를 미리 계산한다.
 * 마지막 인원이 밀린 뒤, 모든 레이어의 흔들림이 SETTLE_DEG 아래로 가라앉아 잠시 유지되면 끝 + 꼬리 시간.
 * 끝나지 않으면 maxSeconds에서 자름.
 */
export function planDuration(input: SimInput, fps: number, maxSeconds: number): Plan {
  const sim = createSimulation()
  const dt = 1 / fps
  const lastPush = Math.max(...input.characters.map((c) => c.swingStartedAt))
  let settledFor = 0
  const steps = Math.ceil(maxSeconds * fps)
  for (let i = 0; i <= steps; i++) {
    const now = i * dt * 1000
    const frame = sim.step(input, now, dt)
    if (now <= lastPush + 50) continue // 마지막 인원이 밀리기 전엔 판단하지 않음
    settledFor = frame.motion < SETTLE_DEG ? settledFor + dt : 0
    if (settledFor >= SETTLE_HOLD_SEC) {
      const end = now / 1000 - SETTLE_HOLD_SEC
      return { seconds: Math.min(maxSeconds, Math.max(MIN_SECONDS, end + EXPORT_TAIL_SEC)), capped: false }
    }
  }
  return { seconds: maxSeconds, capped: true }
}
