import { useEffect, useRef, useState } from 'react'
import { useSwingStore } from '../store/useSwingStore'
import {
  estimatePlan,
  exportSwing,
  outputSize,
  type ExportAspect,
  type ExportFormat,
  type ExportProgress,
  type ExportResult,
} from '../export/exportSwing'
import type { PushMode } from '../export/plan'
import SliderRow from './SliderRow'

const ASPECTS: { value: ExportAspect; label: string }[] = [
  { value: 'screen', label: '지금 화면 비율' },
  { value: 'portrait', label: '세로 9:16 (폰/스토리)' },
  { value: 'square', label: '정사각 1:1' },
  { value: 'landscape', label: '가로 16:9' },
]

const WIDTHS = [360, 480, 720, 1080]
const FPS: Record<ExportFormat, number[]> = { mp4: [30, 60], gif: [10, 15, 20] }
const DEFAULTS: Record<ExportFormat, { width: number; fps: number }> = {
  mp4: { width: 720, fps: 30 },
  gif: { width: 480, fps: 15 },
}

const PHASE_LABEL: Record<ExportProgress['phase'], string> = {
  prepare: '준비하는 중',
  palette: 'GIF 색을 고르는 중',
  encode: '만드는 중',
  finish: '마무리하는 중',
}

const fileStamp = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

/** 저장 탭 — 한 번 밀었을 때 흔들림이 가라앉을 때까지를 MP4/GIF로 저장 */
function ExportPanel() {
  const hasLayers = useSwingStore((s) => s.layers.length > 0)
  const idleOn = useSwingStore((s) => s.idleOn)
  const pushGap = useSwingStore((s) => s.pushGap)
  const characterCount = useSwingStore((s) => s.characters.length)
  useSwingStore((s) => s) // 설정이 바뀌면 예상 길이도 다시 계산

  const [format, setFormat] = useState<ExportFormat>('mp4')
  const [aspect, setAspect] = useState<ExportAspect>('screen')
  const [width, setWidth] = useState(DEFAULTS.mp4.width)
  const [fps, setFps] = useState(DEFAULTS.mp4.fps)
  const [push, setPush] = useState<PushMode>('all')
  const [maxSeconds, setMaxSeconds] = useState(8)

  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const [result, setResult] = useState<(ExportResult & { url: string; name: string }) | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cancelRef = useRef({ cancelled: false })
  const running = progress !== null

  // 결과 파일 주소는 새로 만들거나 탭을 닫을 때 정리
  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result.url)
    },
    [result],
  )

  const selectFormat = (f: ExportFormat) => {
    setFormat(f)
    setWidth(DEFAULTS[f].width)
    setFps(DEFAULTS[f].fps)
    setResult(null)
  }

  const plan = hasLayers ? estimatePlan({ fps, push, maxSeconds }) : null
  const size = outputSize(aspect, width)

  const start = async () => {
    cancelRef.current = { cancelled: false }
    setError(null)
    setResult(null)
    setProgress({ phase: 'prepare', done: 0, total: 1 })
    try {
      const r = await exportSwing({ format, aspect, width, fps, push, maxSeconds }, setProgress, cancelRef.current)
      const name = `ribbon-swing-${fileStamp()}.${r.ext}`
      setResult({ ...r, url: URL.createObjectURL(r.blob), name })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg === 'CANCELLED') setError(null)
      else if (msg === 'MP4_UNSUPPORTED')
        setError('이 브라우저는 MP4 저장을 지원하지 않아요. GIF로 저장하거나 최신 크롬·사파리를 써 주세요.')
      else setError(`저장에 실패했어요: ${msg}`)
    } finally {
      setProgress(null)
    }
  }

  const share = async () => {
    if (!result) return
    const file = new File([result.blob], result.name, { type: result.blob.type })
    try {
      await navigator.share({ files: [file], title: result.name })
    } catch {
      /* 공유 창을 닫은 경우 등 */
    }
  }
  const canShare =
    result !== null &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [new File([result.blob], result.name, { type: result.blob.type })] })

  return (
    <section>
      <h2 className="mb-1 font-bold text-pink-600">MP4 · GIF 저장</h2>
      <p className="mb-3 text-xs text-gray-400">
        한 번 밀었을 때부터 흔들림이 가라앉을 때까지를 저장해요. 매번 똑같은 움직임으로 만들어져요.
      </p>

      <div className="mb-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="저장 형식">
        {(['mp4', 'gif'] as const).map((f) => (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={format === f}
            disabled={running}
            onClick={() => selectFormat(f)}
            className={`rounded border py-1.5 text-sm ${
              format === f ? 'border-pink-500 bg-pink-500 text-white' : 'border-pink-200 text-gray-600 hover:border-pink-400'
            }`}
          >
            {f === 'mp4' ? 'MP4 영상' : 'GIF 움짤'}
          </button>
        ))}
      </div>

      <label className="mb-3 block text-sm">
        화면 비율
        <select
          value={aspect}
          disabled={running}
          onChange={(e) => setAspect(e.target.value as ExportAspect)}
          className="mt-1 w-full rounded border border-pink-200 bg-white px-2 py-1"
        >
          {ASPECTS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </label>

      <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
        <label>
          가로 크기
          <select
            value={width}
            disabled={running}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="mt-1 w-full rounded border border-pink-200 bg-white px-2 py-1"
          >
            {WIDTHS.map((w) => (
              <option key={w} value={w}>
                {w}px
              </option>
            ))}
          </select>
        </label>
        <label>
          프레임 (초당)
          <select
            value={fps}
            disabled={running}
            onChange={(e) => setFps(Number(e.target.value))}
            className="mt-1 w-full rounded border border-pink-200 bg-white px-2 py-1"
          >
            {FPS[format].map((f) => (
              <option key={f} value={f}>
                {f}장
              </option>
            ))}
          </select>
        </label>
      </div>

      {characterCount > 1 && (
        <label className="mb-3 block text-sm">
          밀기 방식
          <select
            value={push}
            disabled={running}
            onChange={(e) => setPush(e.target.value as PushMode)}
            className="mt-1 w-full rounded border border-pink-200 bg-white px-2 py-1"
          >
            <option value="all">한번에 밀기</option>
            <option value="sequential">차례대로 밀기 ({pushGap}초 간격)</option>
          </select>
        </label>
      )}

      <SliderRow
        label="최대 길이 (초)"
        value={maxSeconds}
        min={2}
        max={20}
        step={1}
        onChange={setMaxSeconds}
        hint="흔들림이 이보다 오래 가면 여기서 잘라요"
      />

      <div className="mb-3 rounded bg-pink-50 p-2 text-xs text-gray-600">
        {plan ? (
          <>
            <p>
              예상 길이 <b>{plan.seconds.toFixed(1)}초</b> · {Math.ceil(plan.seconds * fps)}프레임 · {size.w}×{size.h}
            </p>
            {plan.capped && (
              <p className="mt-1 text-pink-600">
                최대 길이까지 흔들림이 끝나지 않아요. 감쇠를 높이면 더 빨리 가라앉아요.
              </p>
            )}
          </>
        ) : (
          <p>레이어를 먼저 올려 주세요.</p>
        )}
        {idleOn && <p className="mt-1">계속 흔들기는 저장에 포함되지 않아요 (한 번 밀기만 저장).</p>}
      </div>

      {running ? (
        <div className="mb-3">
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>{PHASE_LABEL[progress.phase]}</span>
            <span>
              {progress.done} / {progress.total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-pink-100">
            <div
              className="h-full bg-pink-500 transition-[width]"
              style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => (cancelRef.current.cancelled = true)}
            className="mt-2 w-full rounded border border-gray-300 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            취소
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={!hasLayers}
          onClick={start}
          className="mb-3 w-full rounded bg-pink-500 py-2 text-sm font-bold text-white hover:bg-pink-600 disabled:opacity-40"
        >
          {format === 'mp4' ? 'MP4 만들기' : 'GIF 만들기'}
        </button>
      )}

      {error && <p className="mb-3 rounded bg-red-50 p-2 text-xs text-red-600">{error}</p>}

      {result && (
        <div className="rounded border border-pink-200 p-2">
          <div className="mb-2 flex justify-center rounded bg-pink-50 p-1">
            {result.ext === 'mp4' ? (
              <video src={result.url} controls loop muted playsInline autoPlay className="max-h-64 max-w-full" />
            ) : (
              <img src={result.url} alt="저장된 GIF 미리보기" className="max-h-64 max-w-full" />
            )}
          </div>
          <p className="mb-2 text-xs text-gray-500">
            {result.width}×{result.height} · {result.seconds.toFixed(1)}초 · {(result.blob.size / 1024 / 1024).toFixed(1)}MB
          </p>
          <div className="flex gap-2">
            <a
              href={result.url}
              download={result.name}
              className="flex-1 rounded bg-pink-500 py-1.5 text-center text-sm text-white hover:bg-pink-600"
            >
              다운로드
            </a>
            {canShare && (
              <button
                type="button"
                onClick={share}
                className="flex-1 rounded border border-pink-400 py-1.5 text-sm text-pink-500 hover:bg-pink-50"
              >
                공유 · 사진첩에 저장
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default ExportPanel
