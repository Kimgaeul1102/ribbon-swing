import { describe, expect, it } from 'vitest'
import { D_ENTER, D_EXIT, D_TOTAL, PATTERN_W, beltPhase, boxShake, charExtraShake, lidFlap, lookDx, slotAt, slotPose } from './motion'

describe('delivery box motion', () => {
  it.each([2, 3, 3.7, 5])('루프 %s초: 덜컹거림은 끝과 처음 값이 같음', (loop) => {
    expect(boxShake(loop, loop)).toBeCloseTo(boxShake(0, loop))
    expect(charExtraShake(loop, loop)).toBeCloseTo(charExtraShake(0, loop))
    expect(lidFlap(loop, loop)).toBeCloseTo(lidFlap(0, loop))
  })

  it('이동 거리 합이 무늬 폭의 정수 배라서 벨트가 이어짐', () => {
    expect(D_TOTAL % PATTERN_W).toBe(0)
  })

  it('칸의 처음엔 화면 밖 왼쪽, 끝엔 화면 밖 오른쪽 (칸이 바뀔 때 박스가 안 튐)', () => {
    const start = slotPose(0, 0.5)
    const end = slotPose(0.999999, 0.5)
    expect(start.x).toBe(-D_ENTER)
    expect(end.x).toBeCloseTo(D_EXIT, 0)
  })

  it('머무는 동안은 가운데에 멈춰 있고 덜컹거리지 않음', () => {
    const mid = slotPose(0.5, 0.5)
    expect(mid.x).toBe(0)
    expect(mid.moving).toBe(0)
    expect(mid.exiting).toBe(0)
  })

  it('등장은 감속, 퇴장은 가속 (슝)', () => {
    const hold = 0.5
    const enterSpeed = (p: number) => slotPose(p + 0.001, hold).x - slotPose(p, hold).x
    // 등장 구간은 0 ~ 0.2, 퇴장 구간은 0.7 ~ 1.0
    expect(enterSpeed(0.01)).toBeGreaterThan(enterSpeed(0.17))
    expect(enterSpeed(0.72)).toBeLessThan(enterSpeed(0.95))
  })

  it('벨트 움직임은 박스 이동과 같은 양 (등장 + 퇴장 = 총 거리)', () => {
    expect(slotPose(0.2, 0.5).belt).toBeCloseTo(D_ENTER)
    expect(slotPose(0.999999, 0.5).belt).toBeCloseTo(D_TOTAL, 0)
  })

  it('칸이 넘어가도 벨트 무늬 위치가 이어짐', () => {
    const before = beltPhase(0, D_TOTAL)
    const after = beltPhase(1, 0)
    expect(before).toBeCloseTo(after)
  })

  it('1명이면 루프 전체가 한 칸, n명이면 n등분', () => {
    expect(slotAt(2.9, 3, 1)).toMatchObject({ index: 0, slot: 3 })
    expect(slotAt(2.9, 3, 3).index).toBe(2)
    expect(slotAt(1.0, 3, 3)).toMatchObject({ index: 1 })
    expect(slotAt(1.0, 3, 3).p).toBeCloseTo(0)
  })

  it('둘러보기는 시작과 끝이 0', () => {
    expect(lookDx(0, 3, 0)).toBeCloseTo(0)
    expect(lookDx(0.4 * 3, 3, 0)).toBeCloseTo(0)
    expect(lookDx(0.5, 3, 0)).toBeLessThan(0)
  })
})
