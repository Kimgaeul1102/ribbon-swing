import { TAU, cyclesPerLoop, smooth, wrap } from '../../../shared/loop/curves'

/** 덜컹거림 한 번의 목표 주기(초) */
export const SHAKE_PERIOD = 0.4

/** 루프에 정수 번 들어가도록 보정한 덜컹거림 횟수 */
export const shakeCycles = (loop: number) => cyclesPerLoop(loop, SHAKE_PERIOD)

/** 박스 전체의 덜컹거림 (px, 1~2px). 움직이는 중에만 쓰므로 호출하는 쪽에서 moving을 곱함 */
export const boxShake = (t: number, loop: number) => 1.5 * Math.sin((TAU * shakeCycles(loop) * t) / loop)

/** 캐릭터는 박스보다 2px 더 튀고 0.05초 늦게 떨어짐 (px) */
export const charExtraShake = (t: number, loop: number) => 2 * Math.sin((TAU * shakeCycles(loop) * (t - 0.05)) / loop)

/** 뚜껑 펄럭임 ±3° (덜컹거림에 맞춤) */
export const lidFlap = (t: number, loop: number) => 3 * Math.sin((TAU * shakeCycles(loop) * t) / loop + 0.6)

/** 컨베이어 무늬 폭(px) */
export const PATTERN_W = 60
/** 박스가 화면 밖에서 들어오는 거리 / 화면 밖으로 나가는 거리(px). 합이 무늬 폭의 정수 배여야 벨트가 끊기지 않음 */
export const D_ENTER = 600
export const D_EXIT = 600
export const D_TOTAL = D_ENTER + D_EXIT

export type SlotPose = {
  /** 박스의 가로 이동량(px). 0 = 화면 가운데에 멈춘 자리 */
  x: number
  /** 이 칸에서 벨트가 지금까지 움직인 거리(px, 0 ~ D_TOTAL) */
  belt: number
  /** 움직임 세기 0~1 (멈춰 있으면 0). 덜컹거림과 속도선에 씀 */
  moving: number
  /** 퇴장 진행률 0~1 (퇴장 중이 아니면 0) */
  exiting: number
}

/**
 * 캐릭터 한 명의 칸(p: 0~1) 안에서 박스의 위치.
 * 등장(왼쪽에서 감속하며 들어옴) → 머무름(hold 비율) → 퇴장(점점 빨라져서 오른쪽으로 슝)
 */
export function slotPose(p: number, hold: number): SlotPose {
  const move = 1 - hold
  const enter = move * 0.4
  const exit = move * 0.6
  if (p < enter) {
    const q = p / enter
    const e = 1 - (1 - q) ** 3 // 감속
    return { x: D_ENTER * e - D_ENTER, belt: D_ENTER * e, moving: (1 - q) ** 2, exiting: 0 }
  }
  if (p < enter + hold) return { x: 0, belt: D_ENTER, moving: 0, exiting: 0 }
  const q = Math.min((p - enter - hold) / exit, 1)
  const e = q ** 3 // 가속
  return { x: D_EXIT * e, belt: D_ENTER + D_EXIT * e, moving: Math.min(q * q * 1.5, 1), exiting: q }
}

/** 지금 어느 캐릭터 칸인지와 칸 안의 위치. 캐릭터가 n명이면 루프를 n등분 */
export function slotAt(t: number, loop: number, n: number): { index: number; p: number; local: number; slot: number } {
  const slot = loop / n
  const index = Math.min(n - 1, Math.floor(t / slot))
  const local = t - index * slot
  return { index, p: local / slot, local, slot }
}

/** 컨베이어 무늬 위치: 지금까지 움직인 총 거리를 무늬 폭으로 나눈 나머지 (칸마다 정확히 정수 칸 이동) */
export const beltPhase = (index: number, belt: number) => (index * D_TOTAL + belt) % PATTERN_W

/** 눈동자 좌우: 칸 안에서 1회, 왼쪽(-3px) → 오른쪽(+3px) → 제자리. local/slot은 칸 안의 시간/칸 길이 */
export function lookDx(local: number, slot: number, at: number): number {
  const p = wrap(local - at * slot, slot) / slot
  const SPAN = 0.4 // 칸의 몇 %를 쓰는지
  const q = p / SPAN
  if (q >= 1) return 0
  if (q < 0.15) return -3 * smooth(q / 0.15)
  if (q < 0.4) return -3
  if (q < 0.55) return -3 + 6 * smooth((q - 0.4) / 0.15)
  if (q < 0.8) return 3
  return 3 * (1 - smooth((q - 0.8) / 0.2))
}
