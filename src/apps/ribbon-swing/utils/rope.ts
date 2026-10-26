import type { Box } from './trim'

/**
 * 밧줄 감기 — 몸 레이어의 윤곽(줄마다 왼쪽/오른쪽 끝)을 읽어서 그 폭에 맞게 밧줄을 그린 투명 이미지를 만든다.
 * 결과는 몸과 같은 캔버스 크기의 PNG라서 일반 레이어처럼 몸과 함께 흔들리고 저장(MP4/GIF)에도 그대로 들어간다.
 * 정면 자세 기준: 각 바퀴는 몸 앞쪽 절반만 그리고(뒤쪽 절반은 몸에 가려짐), 가운데가 아래로 살짝 처지는 곡선 + 옆으로 갈수록 어두워짐.
 */

export type RopeOptions = {
  top: number // 감기 시작 높이 (몸 내용 영역 높이의 비율 0~1, 위가 0)
  bottom: number // 감기 끝 높이
  turns: number // 바퀴 수
  thickness: number // 밧줄 굵기 (몸 폭의 비율)
  curve: number // 앞쪽이 둥글게 처지는 정도 (0~1)
  knot: boolean // 매듭 + 늘어진 끝
  flat: boolean // true: 굵은 윤곽선 + 단색(만화체), false: 입체(그림자/하이라이트)
  color: string // 단색 밧줄 색
  outline: string // 윤곽선 색
  twist: boolean // 꼬임 선 (단색일 때 짧은 사선)
  tangle: number // 엉킴 (0~1): 클수록 가닥마다 기울기/높이/굵기가 달라지고 서로 교차하며 겹침. 0이면 가지런히 일자로
  seed: number // 엉킴 모양을 정하는 값 (바꾸면 다른 모양)
}

export const DEFAULT_ROPE: RopeOptions = {
  top: 0.35,
  bottom: 0.6,
  turns: 6,
  thickness: 0.08,
  curve: 0.5,
  knot: true,
  flat: true,
  color: '#f6e7c8',
  outline: '#1b1212',
  twist: true,
  tangle: 0.6,
  seed: 7,
}

const ALPHA_ON = 128 // 이 값을 넘는 픽셀을 몸으로 봄

export type Edges = { left: number[]; right: number[] } // 줄(y)마다 몸의 왼쪽/오른쪽 끝 x. 몸이 없는 줄은 -1

/** RGBA 픽셀에서 줄마다 몸의 양 끝을 구한다 */
export function silhouetteEdges(data: Uint8ClampedArray, w: number, h: number): Edges {
  const left: number[] = new Array(h).fill(-1)
  const right: number[] = new Array(h).fill(-1)
  for (let y = 0; y < h; y++) {
    const row = y * w * 4
    for (let x = 0; x < w; x++) {
      if (data[row + x * 4 + 3] > ALPHA_ON) {
        left[y] = x
        break
      }
    }
    if (left[y] < 0) continue
    for (let x = w - 1; x >= 0; x--) {
      if (data[row + x * 4 + 3] > ALPHA_ON) {
        right[y] = x + 1
        break
      }
    }
  }
  return { left, right }
}

/** 들쭉날쭉한 윤곽을 이동 평균으로 부드럽게 (몸이 없는 줄은 건너뜀) */
export function smoothEdges(edges: Edges, radius: number): Edges {
  const avg = (arr: number[]) =>
    arr.map((v, y) => {
      if (v < 0) return -1
      let sum = 0
      let n = 0
      for (let k = Math.max(0, y - radius); k <= Math.min(arr.length - 1, y + radius); k++) {
        if (arr[k] >= 0) {
          sum += arr[k]
          n++
        }
      }
      return sum / n
    })
  return { left: avg(edges.left), right: avg(edges.right) }
}

/** y 높이의 몸 양 끝. 그 줄에 몸이 없으면 가까운 줄(위아래 maxGap 이내)을 찾고, 없으면 null */
export function edgesAt(edges: Edges, y: number, maxGap: number): { left: number; right: number } | null {
  const yi = Math.round(y)
  for (let d = 0; d <= maxGap; d++) {
    for (const k of d === 0 ? [yi] : [yi - d, yi + d]) {
      if (k >= 0 && k < edges.left.length && edges.left[k] >= 0 && edges.right[k] > edges.left[k])
        return { left: edges.left[k], right: edges.right[k] }
    }
  }
  return null
}

/** 같은 seed면 항상 같은 값이 나오는 난수 (엉킴 모양이 그릴 때마다 바뀌지 않게) */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type RopeTurn = {
  yc: number // 가운데 높이
  left: number // 그 높이의 몸 왼쪽 끝
  right: number
  w: number // 이 가닥의 굵기
  tilt: number // 한쪽 끝이 반대쪽보다 내려가는 정도 (양수: 오른쪽이 아래, 음수: 왼쪽이 아래)
  sagMul: number // 처짐 배율
}
/** t: 기준 굵기(매듭 등에 씀), order: 그리는 순서(나중에 그린 가닥이 위로 덮임) */
export type RopePlan = { t: number; pitch: number; turns: RopeTurn[]; order: number[] }

/** 바퀴마다 높이와 몸 폭을 정한다. 몸을 못 찾으면 null */
export function planRope(edges: Edges, bbox: Box, o: RopeOptions): RopePlan | null {
  const y0 = bbox.y + Math.min(o.top, o.bottom - 0.02) * bbox.h
  const y1 = bbox.y + o.bottom * bbox.h
  const n = Math.max(1, Math.round(o.turns))
  const pitch = (y1 - y0) / n
  const m = Math.min(1, Math.max(0, o.tangle))
  // 엉킴이 없으면 바퀴 간격보다 두껍지 않게(일자로 나란히), 엉킴이 크면 서로 덮이도록 더 두껍게 허용
  const t = Math.max(2, Math.min(o.thickness * bbox.w, pitch * (1.15 + 2 * m)))
  const rand = seededRandom(o.seed)
  const turns: RopeTurn[] = []
  const keys: number[] = []
  for (let k = 0; k < n; k++) {
    const r = [rand(), rand(), rand(), rand(), rand(), rand()] // 몸을 못 찾은 바퀴가 있어도 다른 바퀴 모양이 안 바뀌게 항상 다 뽑음
    const yc = y0 + (k + 0.5) * pitch + (r[0] - 0.5) * pitch * m * 0.8
    const e = edgesAt(edges, yc, Math.round(bbox.h * 0.05))
    if (!e) continue
    const sign = m > 0 && r[1] < 0.5 ? -1 : 1 // 엉킴이 있으면 가닥마다 기울어지는 방향이 제각각
    turns.push({
      yc,
      ...e,
      w: t * (1 + m * (r[4] - 0.5) * 0.3),
      tilt: sign * (pitch * 0.3 + m * (e.right - e.left) * 0.09 * r[2]),
      sagMul: 1 + m * (r[3] - 0.5) * 0.8,
    })
    keys.push(r[5])
  }
  if (!turns.length) return null
  // 엉킴이 있으면 어떤 가닥이 위로 덮일지도 제각각 (매듭은 항상 맨 위)
  const order = turns.map((_, i) => i)
  if (m > 0) order.sort((a, b) => keys[a] - keys[b])
  return { t, pitch, turns, order }
}

type Pt = { x: number; y: number }

/** 한 바퀴의 앞쪽 곡선: 가운데가 처지고, 한 바퀴 돌며 조금씩 내려가는 기울기 */
export function turnPoints(turn: RopeTurn, curve: number, steps = 48): Pt[] {
  const mid = (turn.left + turn.right) / 2
  const half = (turn.right - turn.left) / 2 + turn.w * 0.35 // 밧줄 굵기만큼 몸 바깥으로 살짝 나감
  const sag = curve * turn.sagMul * (turn.right - turn.left) * 0.1
  const tilt = turn.tilt
  return Array.from({ length: steps + 1 }, (_, i) => {
    const u = (i / steps) * 2 - 1
    return { x: mid + u * half, y: turn.yc + sag * (1 - u * u) + tilt * u }
  })
}

/** 점들을 따라 일정 간격으로 위치와 진행 방향을 구한다 */
function sampleAlong(pts: Pt[], step: number): { p: Pt; tx: number; ty: number }[] {
  const out: { p: Pt; tx: number; ty: number }[] = []
  let next = step / 2 // 다음 표시를 놓을 누적 거리
  let dist = 0 // 지금 구간 시작까지의 누적 거리
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    if (len === 0) continue
    const tx = (b.x - a.x) / len
    const ty = (b.y - a.y) / len
    while (next <= dist + len) {
      const d = next - dist
      out.push({ p: { x: a.x + tx * d, y: a.y + ty * d }, tx, ty })
      next += step
    }
    dist += len
  }
  return out
}

function strokePath(ctx: CanvasRenderingContext2D, pts: Pt[], dy: number): void {
  ctx.beginPath()
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y + dy) : ctx.lineTo(p.x, p.y + dy)))
  ctx.stroke()
}

/** 꼬인 밧줄 한 가닥: 둥근 단면(어두움→중간→하이라이트) + 비스듬한 꼬임 무늬 */
function cord(ctx: CanvasRenderingContext2D, pts: Pt[], w: number, shadow: boolean): void {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowBlur = w * 0.6
    ctx.shadowOffsetY = w * 0.3
  }
  ctx.strokeStyle = '#7d5d33'
  ctx.lineWidth = w
  strokePath(ctx, pts, 0)
  ctx.shadowColor = 'transparent'
  ctx.strokeStyle = '#b98f52'
  ctx.lineWidth = w * 0.78
  strokePath(ctx, pts, -w * 0.05)
  ctx.strokeStyle = '#dcc18c'
  ctx.lineWidth = w * 0.36
  strokePath(ctx, pts, -w * 0.17)

  // 꼬임: 진행 방향에 비스듬한 짧은 선들
  ctx.lineCap = 'butt'
  for (const { p, tx, ty } of sampleAlong(pts, w * 0.8)) {
    const nx = -ty
    const ny = tx
    const sl = w * 0.32 // 기울어지는 정도
    ctx.strokeStyle = 'rgba(60,38,16,0.55)'
    ctx.lineWidth = Math.max(1, w * 0.13)
    ctx.beginPath()
    ctx.moveTo(p.x - nx * w * 0.5 - tx * sl, p.y - ny * w * 0.5 - ty * sl)
    ctx.lineTo(p.x + nx * w * 0.5 + tx * sl, p.y + ny * w * 0.5 + ty * sl)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255,238,200,0.3)'
    ctx.lineWidth = Math.max(1, w * 0.07)
    ctx.beginPath()
    ctx.moveTo(p.x - nx * w * 0.4 - tx * (sl - w * 0.17), p.y - ny * w * 0.4 - ty * (sl - w * 0.17))
    ctx.lineTo(p.x + nx * w * 0.4 + tx * (sl + w * 0.17), p.y + ny * w * 0.4 + ty * (sl + w * 0.17))
    ctx.stroke()
  }
  ctx.restore()
}

export type CordStyle = Pick<RopeOptions, 'color' | 'outline' | 'twist'>

/** 점들을 따라간 거리 s의 위치에서 옆(v)으로 벗어난 좌표. 거리/옆 값은 범위를 넘으면 끝에 붙임 */
function pathFrame(pts: Pt[]): { total: number; at: (s: number, v: number) => Pt } {
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y))
  const total = cum[cum.length - 1]
  const at = (s: number, v: number): Pt => {
    const d = Math.min(total, Math.max(0, s))
    let i = 1
    while (i < pts.length - 1 && cum[i] < d) i++
    const a = pts[i - 1]
    const b = pts[i]
    const len = cum[i] - cum[i - 1] || 1
    const f = (d - cum[i - 1]) / len
    const tx = (b.x - a.x) / len
    const ty = (b.y - a.y) / len
    return { x: a.x + (b.x - a.x) * f - ty * v, y: a.y + (b.y - a.y) * f + tx * v }
  }
  return { total, at }
}

/** 윤곽선 굵기: 밧줄 굵기(w)에 비례, 얇을 때는 최소 2px */
const outlineOf = (w: number) => Math.max(2, w * 0.3)

/** 윤곽선까지 포함해 전체 굵기가 total이 되도록 하는 밧줄 안쪽(채움) 굵기 */
export function ropeInnerWidth(total: number): number {
  const k = total / 1.6
  return k >= 20 / 3 ? k : Math.max(1, total - 4)
}

/**
 * 단색 밧줄 한 가닥: 굵은 윤곽선 + 단색 채움 + (선택) 꼬임.
 * 꼬임은 사진 속 밧줄처럼 한쪽 가장자리에서 반대쪽으로 S자로 휘어 넘어가는 가닥 선을 일정 간격으로 반복해서 그림.
 */
export function drawRopeCord(ctx: CanvasRenderingContext2D, pts: Pt[], w: number, o: CordStyle): void {
  const ol = outlineOf(w)
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = o.outline
  ctx.lineWidth = w + ol * 2
  strokePath(ctx, pts, 0)
  ctx.strokeStyle = o.color
  ctx.lineWidth = w
  strokePath(ctx, pts, 0)
  if (o.twist) {
    const { total, at } = pathFrame(pts)
    const h = w / 2
    const P = w * 0.8 // 가닥 하나가 길이 방향으로 차지하는 간격
    ctx.strokeStyle = o.outline
    ctx.lineWidth = Math.max(1.2, ol * 0.55)
    ctx.lineCap = 'round'
    for (let s = 0; s < total - P * 0.2; s += P) {
      const a = at(s, -h)
      const c1 = at(s + P * 0.6, -h)
      const c2 = at(s + P * 0.4, h)
      const b = at(s + P, h)
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, b.x, b.y)
      ctx.stroke()
    }
  }
  ctx.restore()
}

/** 직선 밧줄 (매달린 끈, 가로대): 전체 굵기가 thickness가 되도록, 양 끝이 a, b에 딱 맞게 */
export function drawRopeLine(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, thickness: number, o: CordStyle): void {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
  const r = thickness / 2 // 둥근 끝이 a, b 밖으로 안 나가게 안쪽에서 시작
  const ux = (b.x - a.x) / len
  const uy = (b.y - a.y) / len
  if (len <= thickness) return
  drawRopeCord(ctx, [{ x: a.x + ux * r, y: a.y + uy * r }, { x: b.x - ux * r, y: b.y - uy * r }], ropeInnerWidth(thickness), o)
}

/** 기본 매달린 끈/가로대의 모양 */
export const ROPE_LOOK: CordStyle = { color: DEFAULT_ROPE.color, outline: DEFAULT_ROPE.outline, twist: true }

const cordFlat = drawRopeCord

/** 단색 매듭: 윤곽선 있는 동그란 매듭 + 늘어진 끝 두 가닥 */
function drawKnotFlat(ctx: CanvasRenderingContext2D, at: Pt, t: number, o: RopeOptions): void {
  const tail = (dx: number, len: number, bend: number): Pt[] =>
    Array.from({ length: 21 }, (_, i) => {
      const s = i / 20
      return { x: at.x + dx * s + Math.sin(s * Math.PI) * bend, y: at.y + len * s }
    })
  cordFlat(ctx, tail(-t * 1.4, t * 4.6, -t * 0.6), t * 0.8, o)
  cordFlat(ctx, tail(t * 1.1, t * 5.4, t * 0.7), t * 0.8, o)
  ctx.save()
  ctx.fillStyle = o.color
  ctx.strokeStyle = o.outline
  ctx.lineWidth = Math.max(2, t * 0.3)
  ctx.beginPath()
  ctx.ellipse(at.x, at.y, t * 0.95, t * 0.8, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.lineWidth = Math.max(1.5, t * 0.18)
  ctx.beginPath()
  ctx.arc(at.x, at.y, t * 0.45, 0.2 * Math.PI, 1.1 * Math.PI)
  ctx.stroke()
  ctx.restore()
}

/** 한 바퀴를 작은 임시 캔버스에 그리고(양 끝을 어둡게 해 몸 뒤로 도는 느낌) 본 캔버스에 올린다 */
function drawTurn(main: CanvasRenderingContext2D, pts: Pt[], t: number): void {
  const pad = Math.ceil(t * 2)
  const minX = Math.min(...pts.map((p) => p.x)) - pad
  const minY = Math.min(...pts.map((p) => p.y)) - pad
  const w = Math.ceil(Math.max(...pts.map((p) => p.x)) + pad - minX)
  const h = Math.ceil(Math.max(...pts.map((p) => p.y)) + pad - minY)
  const tmp = document.createElement('canvas')
  tmp.width = w
  tmp.height = h
  const c = tmp.getContext('2d')!
  cord(c, pts.map((p) => ({ x: p.x - minX, y: p.y - minY })), t, true)
  c.globalCompositeOperation = 'source-atop'
  const g = c.createLinearGradient(pad, 0, w - pad, 0)
  g.addColorStop(0, 'rgba(25,14,4,0.6)')
  g.addColorStop(0.2, 'rgba(25,14,4,0)')
  g.addColorStop(0.8, 'rgba(25,14,4,0)')
  g.addColorStop(1, 'rgba(25,14,4,0.6)')
  c.fillStyle = g
  c.fillRect(0, 0, w, h)
  main.drawImage(tmp, minX, minY)
}

/** 매듭과 아래로 늘어진 끝 두 가닥 */
function drawKnot(ctx: CanvasRenderingContext2D, at: Pt, t: number): void {
  const tail = (dx: number, len: number, bend: number): Pt[] =>
    Array.from({ length: 21 }, (_, i) => {
      const s = i / 20
      return { x: at.x + dx * s + Math.sin(s * Math.PI) * bend, y: at.y + len * s }
    })
  cord(ctx, tail(-t * 1.4, t * 4.6, -t * 0.6), t * 0.8, true)
  cord(ctx, tail(t * 1.1, t * 5.4, t * 0.7), t * 0.8, true)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = t * 0.5
  ctx.shadowOffsetY = t * 0.25
  const g = ctx.createRadialGradient(at.x - t * 0.3, at.y - t * 0.3, t * 0.1, at.x, at.y, t * 1.1)
  g.addColorStop(0, '#e2c995')
  g.addColorStop(0.6, '#b98f52')
  g.addColorStop(1, '#7d5d33')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(at.x, at.y, t * 1.0, t * 0.8, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.strokeStyle = 'rgba(60,38,16,0.6)'
  ctx.lineWidth = Math.max(1, t * 0.12)
  for (const r of [-0.4, 0.1, 0.55]) {
    ctx.beginPath()
    ctx.arc(at.x, at.y, t * 0.75, r * Math.PI, (r + 0.35) * Math.PI)
    ctx.stroke()
  }
}

export type RopeSource = { image: CanvasImageSource; bbox: Box } // 윤곽을 읽을 몸 레이어 (원본 캔버스 크기 기준)

/**
 * 밧줄 이미지를 그린다. canvasW×canvasH는 몸 레이어 원본 크기, scale<1이면 미리보기용으로 줄여서 그림.
 * 몸을 못 찾으면 null.
 */
export function renderRope(
  sources: RopeSource[],
  canvasW: number,
  canvasH: number,
  o: RopeOptions,
  scale = 1,
): HTMLCanvasElement | null {
  const W = Math.max(1, Math.round(canvasW * scale))
  const H = Math.max(1, Math.round(canvasH * scale))
  const sil = document.createElement('canvas')
  sil.width = W
  sil.height = H
  const sc = sil.getContext('2d', { willReadFrequently: true })!
  for (const s of sources) sc.drawImage(s.image, 0, 0, W, H)
  const radius = Math.max(1, Math.round(H * 0.004))
  const edges = smoothEdges(silhouetteEdges(sc.getImageData(0, 0, W, H).data, W, H), radius)

  const x0 = Math.min(...sources.map((s) => s.bbox.x))
  const y0 = Math.min(...sources.map((s) => s.bbox.y))
  const x1 = Math.max(...sources.map((s) => s.bbox.x + s.bbox.w))
  const y1 = Math.max(...sources.map((s) => s.bbox.y + s.bbox.h))
  const bbox: Box = { x: x0 * scale, y: y0 * scale, w: (x1 - x0) * scale, h: (y1 - y0) * scale }
  const plan = planRope(edges, bbox, o)
  if (!plan) return null

  const out = document.createElement('canvas')
  out.width = W
  out.height = H
  const ctx = out.getContext('2d')!
  for (const i of plan.order) {
    const turn = plan.turns[i]
    const pts = turnPoints(turn, o.curve)
    if (o.flat) cordFlat(ctx, pts, turn.w, o)
    else drawTurn(ctx, pts, turn.w)
  }
  if (o.knot) {
    const bottom = turnPoints(plan.turns[plan.turns.length - 1], o.curve) // 맨 아래 바퀴에 매듭
    const at = bottom[Math.round(bottom.length * 0.64)]
    if (o.flat) drawKnotFlat(ctx, at, plan.t, o)
    else drawKnot(ctx, at, plan.t)
  }
  return out
}
