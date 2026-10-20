/**
 * 인원 i(0부터)의 가로 중심(%)과 열 너비(%).
 * spacing 1이면 무대를 균등 분할, 줄이면 가운데로 모임 (이미지가 서로 겹칠 수 있음)
 */
export function characterColumn(i: number, n: number, spacing: number): { center: number; width: number } {
  const width = (100 / n) * spacing
  return { center: 50 + (i + 0.5 - n / 2) * width, width }
}
