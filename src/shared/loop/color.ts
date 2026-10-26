function parse(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** '#rrggbb' + 투명도 → 'rgba(...)' */
export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = parse(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

/** 색을 밝게(amt > 0) / 어둡게(amt < 0). amt는 -1 ~ 1 */
export function shade(hex: string, amt: number): string {
  const [r, g, b] = parse(hex)
  const f = (c: number) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt))
  return `rgb(${f(r)},${f(g)},${f(b)})`
}
