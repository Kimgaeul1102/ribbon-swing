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
}

export const DEFAULT_ROPE: RopeOptions = {
  top: 0.35,
  bottom: 0.6,
  turns: 4,
  thickness: 0.06,
  curve: 0.5,
  knot: true,
  flat: true,
  color: '#f6e7c8',
  outline: '#1b1212',
  twist: true,
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

export type RopeTurn = { yc: number; left: number; right: number }
export type RopePlan = { t: number; pitch: number; turns: RopeTurn[] }

/** 바퀴마다 높이와 몸 폭을 정한다. 몸을 못 찾으면 null */
export function planRope(edges: Edges, bbox: Box, o: RopeOptions): RopePlan | null {
  const y0 = bbox.y + Math.min(o.top, o.bottom - 0.02) * bbox.h
  const y1 = bbox.y + o.bottom * bbox.h
  const n = Math.max(1, Math.round(o.turns))
  const pitch = (y1 - y0) / n
  const t = Math.max(2, Math.min(o.thickness * bbox.w, pitch * 1.15)) // 바퀴 간격보다 두꺼우면 겹치므로 제한
  const turns: RopeTurn[] = []
  for (let k = 0; k < n; k++) {
    const yc = y0 + (k + 0.5) * pitch
    const e = edgesAt(edges, yc, Math.round(bbox.h * 0.05))
    if (e) turns.push({ yc, ...e })
  }
  return turns.length ? { t, pitch, turns } : null
}

type Pt = { x: number; y: number }

/** 한 바퀴의 앞쪽 곡선: 가운데가 처지고, 한 바퀴 돌며 조금씩 내려가는 기울기 */
export function turnPoints(turn: RopeTurn, t: number, pitch: number, curve: number, steps = 48): Pt[] {
  const mid = (turn.left + turn.right) / 2
  const half = (turn.right - turn.left) / 2 + t * 0.35 // 밧줄 굵기만큼 몸 바깥으로 살짝 나감
  const sag = curve * (turn.right - turn.left) * 0.1
  const tilt = pitch * 0.3
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

/** 단색 밧줄 한 가닥: 굵은 윤곽선 + 단색 채움 + (선택) 짧은 사선 꼬임 */
function cordFlat(ctx: CanvasRenderingContext2D, pts: Pt[], w: number, o: RopeOptions): void {
  const ol = Math.max(2, w * 0.3)
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
    ctx.lineCap = 'butt'
    ctx.strokeStyle = o.outline
    ctx.lineWidth = Math.max(1.5, ol * 0.6)
    for (const { p, tx, ty } of sampleAlong(pts, w * 1.1)) {
      const nx = -ty
      const ny = tx
      const sl = w * 0.22
      ctx.beginPath()
      ctx.moveTo(p.x - nx * w * 0.5 - tx * sl, p.y - ny * w * 0.5 - ty * sl)
      ctx.lineTo(p.x + nx * w * 0.5 + tx * sl, p.y + ny * w * 0.5 + ty * sl)
      ctx.stroke()
    }
  }
  ctx.restore()
}

/** 단색 매듭: 윤곽선 있는 동그란 매듭 + 늘어진 끝 두 가닥 */
function drawKnotFlat(ctx: CanvasRenderingContext2D, at: Pt, t: number, o: RopeOptions): void {
  const tail = (dx: number, len: number, bend: number): Pt[] =>
    Array.from({ length: 21 }, (_, i) => {
      const s = i / 20
      return { x: at.x + dx * s + Math.sin(s * Math.PI) * bend, y: at.y + len * s }
    })
  cordFlat(ctx, tail(-t * 1.4, t * 4.6, -t * 0.6), t * 0.8, { ...o, twist: false })
  cordFlat(ctx, tail(t * 1.1, t * 5.4, t * 0.7), t * 0.8, { ...o, twist: false })
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
  let last: Pt[] = []
  for (const turn of plan.turns) {
    last = turnPoints(turn, plan.t, plan.pitch, o.curve)
    if (o.flat) cordFlat(ctx, last, plan.t, o)
    else drawTurn(ctx, last, plan.t)
  }
  if (o.knot && last.length) {
    const at = last[Math.round(last.length * 0.64)]
    if (o.flat) drawKnotFlat(ctx, at, plan.t, o)
    else drawKnot(ctx, at, plan.t)
  }
  return out
}
