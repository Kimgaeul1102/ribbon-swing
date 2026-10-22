import { useEffect, useRef, useState } from 'react'
import { useSwingStore, type Layer } from '../store/useSwingStore'
import { useLibraryStore } from '../store/useLibraryStore'
import { DEFAULT_ROPE, renderRope, type RopeOptions } from '../utils/rope'
import SliderRow from './SliderRow'

const images = new Map<string, Promise<HTMLImageElement>>()
function loadImage(src: string): Promise<HTMLImageElement> {
  if (!images.has(src))
    images.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('이미지를 불러오지 못했어요'))
        img.src = src
      }),
    )
  return images.get(src)!
}

const PREVIEW_MAX = 520 // 미리보기를 그릴 때 긴 쪽 최대 px
const BODY_NAME = /body|몸|본체/i

/**
 * 밧줄 감기 — 정면 서 있는 캐릭터의 몸 윤곽에 맞춰 밧줄을 그려서 새 레이어(폴더)로 추가한다.
 * 윤곽을 읽을 레이어(몸, 옷 등)를 고르고, 감는 범위/바퀴 수/굵기를 정한다.
 */
function RopePanel() {
  const allLayers = useSwingStore((s) => s.layers)
  const activeId = useSwingStore((s) => s.activeCharacterId)
  const addGeneratedLayer = useLibraryStore((s) => s.addGeneratedLayer)
  const [opts, setOpts] = useState<RopeOptions>(DEFAULT_ROPE)
  const [picked, setPicked] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)

  const layers = allLayers.filter((l) => l.characterId === activeId).sort((a, b) => a.zIndex - b.zIndex)
  // 고른 레이어가 없거나 지워졌으면 이름이 몸 같은 레이어, 없으면 맨 뒤 레이어
  const valid = picked.filter((id) => layers.some((l) => l.id === id))
  const fallback = layers.find((l) => BODY_NAME.test(l.name)) ?? layers[0]
  const selectedIds = valid.length ? valid : fallback ? [fallback.id] : []
  const primary = layers.find((l) => selectedIds.includes(l.id))
  // 캔버스 크기가 같은 레이어만 함께 쓸 수 있음 (원본 좌표가 맞아야 해서)
  const sources: Layer[] = primary
    ? layers.filter((l) => selectedIds.includes(l.id) && l.canvas.w === primary.canvas.w && l.canvas.h === primary.canvas.h)
    : []
  const sourceKey = sources.map((l) => l.id).join(',')
  const optsKey = JSON.stringify(opts)

  // 미리보기: 같은 캔버스 크기의 켜진 레이어들 위에 밧줄을 얹어서 보여줌
  useEffect(() => {
    const canvas = previewRef.current
    if (!canvas || !primary) return
    let cancelled = false
    void (async () => {
      const scale = Math.min(1, PREVIEW_MAX / Math.max(primary.canvas.w, primary.canvas.h))
      const sameCanvas = layers.filter(
        (l) => l.enabled && l.canvas.w === primary.canvas.w && l.canvas.h === primary.canvas.h,
      )
      const loaded = await Promise.all(sameCanvas.map(async (l) => ({ l, img: await loadImage(l.src) })))
      if (cancelled) return
      const rope = renderRope(
        sources.map((l) => ({ image: loaded.find((x) => x.l.id === l.id)!.img, bbox: l.bbox })),
        primary.canvas.w,
        primary.canvas.h,
        opts,
        scale,
      )
      // 보여줄 영역: 고른 레이어 내용 영역에 여백을 더해 자름
      const x0 = Math.min(...sources.map((l) => l.bbox.x))
      const y0 = Math.min(...sources.map((l) => l.bbox.y))
      const x1 = Math.max(...sources.map((l) => l.bbox.x + l.bbox.w))
      const y1 = Math.max(...sources.map((l) => l.bbox.y + l.bbox.h))
      const padX = (x1 - x0) * 0.1
      const padY = (y1 - y0) * 0.05
      const cx = Math.max(0, (x0 - padX) * scale)
      const cy = Math.max(0, (y0 - padY) * scale)
      const cw = Math.min(primary.canvas.w * scale - cx, (x1 - x0 + padX * 2) * scale)
      const ch = Math.min(primary.canvas.h * scale - cy, (y1 - y0 + padY * 2) * scale)
      canvas.width = Math.max(1, Math.round(cw))
      canvas.height = Math.max(1, Math.round(ch))
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.translate(-cx, -cy)
      for (const { img } of loaded) ctx.drawImage(img, 0, 0, primary.canvas.w * scale, primary.canvas.h * scale)
      if (rope) ctx.drawImage(rope, 0, 0)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      setMessage(rope ? null : '고른 레이어의 이 높이에는 몸이 없어요. 감는 범위를 바꿔 보세요.')
    })().catch((e) => !cancelled && setMessage(e instanceof Error ? e.message : String(e)))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- layers 전체 대신 키로 비교
  }, [sourceKey, optsKey, primary?.id, allLayers.length])

  const set = <K extends keyof RopeOptions>(key: K, value: RopeOptions[K]) => setOpts((o) => ({ ...o, [key]: value }))

  const apply = async () => {
    if (!primary || busy) return
    setBusy(true)
    setMessage(null)
    try {
      const imgs = await Promise.all(sources.map((l) => loadImage(l.src)))
      const rope = renderRope(
        sources.map((l, i) => ({ image: imgs[i], bbox: l.bbox })),
        primary.canvas.w,
        primary.canvas.h,
        opts,
      )
      if (!rope) {
        setMessage('고른 레이어의 이 높이에는 몸이 없어요. 감는 범위를 바꿔 보세요.')
        return
      }
      const blob = await new Promise<Blob | null>((resolve) => rope.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('이미지를 만들지 못했어요')
      await addGeneratedLayer(blob, '밧줄', primary)
      setMessage('밧줄 폴더를 맨 위에 추가했어요. 마음에 안 들면 폴더를 지우고 다시 만들어 보세요.')
    } catch (e) {
      setMessage(`만들지 못했어요: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h2 className="mb-1 font-bold text-pink-600">🪢 밧줄 감기</h2>
      {layers.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">레이어를 먼저 올려 주세요.</p>
      ) : (
        <>
          <p className="mb-2 mt-2 text-xs text-gray-400">
            정면으로 서 있는 캐릭터의 몸 윤곽에 맞춰 밧줄을 감아요. 몸 모양을 읽을 레이어를 골라 주세요 (옷까지 입혔다면 옷도 함께).
          </p>
          <fieldset className="mb-3">
            <legend className="mb-1 text-sm">윤곽을 읽을 레이어</legend>
            {layers.map((l) => {
              const compatible = !primary || (l.canvas.w === primary.canvas.w && l.canvas.h === primary.canvas.h)
              return (
                <label key={l.id} className={`flex items-center gap-2 text-sm ${compatible ? '' : 'opacity-40'}`}>
                  <input
                    type="checkbox"
                    disabled={!compatible && !selectedIds.includes(l.id)}
                    checked={selectedIds.includes(l.id)}
                    onChange={(e) =>
                      setPicked(e.target.checked ? [...selectedIds, l.id] : selectedIds.filter((id) => id !== l.id))
                    }
                    className="accent-pink-500"
                  />
                  <span className="truncate">{l.name}</span>
                  {!compatible && <span className="text-xs text-gray-400">(크기가 달라 함께 못 써요)</span>}
                </label>
              )
            })}
          </fieldset>

          <div className="mb-3 flex justify-center rounded bg-pink-50 p-1">
            <canvas ref={previewRef} className="max-h-80 max-w-full" />
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="밧줄 스타일">
            {([true, false] as const).map((flat) => (
              <button
                key={String(flat)}
                type="button"
                role="radio"
                aria-checked={opts.flat === flat}
                onClick={() => set('flat', flat)}
                className={`rounded border py-1 text-sm ${
                  opts.flat === flat ? 'border-pink-500 bg-pink-500 text-white' : 'border-pink-200 text-gray-600 hover:border-pink-400'
                }`}
              >
                {flat ? '단색 (만화체)' : '입체'}
              </button>
            ))}
          </div>
          {opts.flat && (
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <label className="flex items-center gap-1">
                밧줄색
                <input type="color" value={opts.color} onChange={(e) => set('color', e.target.value)} className="h-6 w-8" />
              </label>
              <label className="flex items-center gap-1">
                윤곽선색
                <input type="color" value={opts.outline} onChange={(e) => set('outline', e.target.value)} className="h-6 w-8" />
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={opts.twist} onChange={(e) => set('twist', e.target.checked)} className="accent-pink-500" />
                꼬임 선
              </label>
            </div>
          )}

          <SliderRow
            label="감기 시작 (위)"
            value={opts.top}
            display={`${Math.round(opts.top * 100)}%`}
            min={0}
            max={0.95}
            step={0.01}
            onChange={(v) => set('top', Math.min(v, opts.bottom - 0.03))}
            hint="몸 높이에서 위가 0%, 발끝이 100%"
          />
          <SliderRow
            label="감기 끝 (아래)"
            value={opts.bottom}
            display={`${Math.round(opts.bottom * 100)}%`}
            min={0.05}
            max={1}
            step={0.01}
            onChange={(v) => set('bottom', Math.max(v, opts.top + 0.03))}
          />
          <SliderRow label="바퀴 수" value={opts.turns} min={1} max={14} step={1} onChange={(v) => set('turns', v)} />
          <SliderRow
            label="엉킴"
            value={opts.tangle}
            display={`${Math.round(opts.tangle * 100)}%`}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => set('tangle', v)}
            hint="0%는 가지런히 일자로, 높이면 가닥이 비스듬히 교차하며 서로 겹쳐요"
          />
          {opts.tangle > 0 && (
            <button
              type="button"
              onClick={() => set('seed', Math.floor(Math.random() * 1e9))}
              className="mb-3 w-full rounded border border-pink-400 py-1 text-sm text-pink-500 hover:bg-pink-50"
            >
              🎲 다시 섞기 (다른 엉킴 모양)
            </button>
          )}
          <SliderRow
            label="굵기"
            value={opts.thickness}
            display={`${Math.round(opts.thickness * 100)}%`}
            min={0.015}
            max={0.1}
            step={0.005}
            onChange={(v) => set('thickness', v)}
            hint="몸 폭 기준. 바퀴 간격보다 두꺼우면 자동으로 줄어요"
          />
          <SliderRow
            label="앞쪽 처짐"
            value={opts.curve}
            display={`${Math.round(opts.curve * 100)}%`}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => set('curve', v)}
            hint="클수록 둥글게 감긴 느낌"
          />
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={opts.knot} onChange={(e) => set('knot', e.target.checked)} className="accent-pink-500" />
            매듭과 늘어진 끝 그리기
          </label>

          {message && <p className="mb-2 rounded bg-pink-50 p-2 text-xs text-gray-600">{message}</p>}
          <button
            type="button"
            disabled={busy || !primary}
            onClick={apply}
            className="w-full rounded bg-pink-500 py-2 text-sm font-bold text-white hover:bg-pink-600 disabled:opacity-40"
          >
            {busy ? '만드는 중…' : '밧줄 레이어로 추가'}
          </button>
          <p className="mt-1 text-xs text-gray-400">
            몸과 같은 움직임으로 함께 흔들려요. 팔이 밧줄 위로 와야 하면 레이어 순서(▲▼)로 조절하세요.
          </p>
        </>
      )}
    </section>
  )
}

export default RopePanel
