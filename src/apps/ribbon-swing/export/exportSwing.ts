import { useSwingStore } from '../store/useSwingStore'
import { useLibraryStore } from '../store/useLibraryStore'
import { createSimulation } from '../sim/swingSim'
import { layoutFor } from '../utils/frame'
import { cookStep, getCook } from '../utils/fire'
import { buildExportInput, planDuration, type Plan, type PushMode } from './plan'
import { renderFrame, type SceneSnapshot } from './renderScene'
import { buildPalette, createGifSink, createMp4Sink, type FrameSink } from './encoders'

export type ExportFormat = 'mp4' | 'gif'
export type ExportAspect = 'screen' | 'portrait' | 'square' | 'landscape'

export type ExportOptions = {
  format: ExportFormat
  aspect: ExportAspect
  width: number // 출력 가로 px
  fps: number
  push: PushMode
  maxSeconds: number
}

export type ExportProgress = { phase: 'prepare' | 'palette' | 'encode' | 'finish'; done: number; total: number }

export type ExportResult = {
  blob: Blob
  ext: 'mp4' | 'gif'
  seconds: number
  frames: number
  width: number
  height: number
  capped: boolean
}

/** 화면 비율을 고르지 않는 한 지금 보이는 무대 크기를 그대로 씀. 나머지는 높이 720(화면 px)을 기준으로 정함 */
const REF_STAGE_H = 720
const ASPECT_RATIO: Record<Exclude<ExportAspect, 'screen'>, number> = {
  portrait: 9 / 16,
  square: 1,
  landscape: 16 / 9,
}

export function stageSizeFor(aspect: ExportAspect): { w: number; h: number } {
  if (aspect === 'screen') {
    const el = document.querySelector('[data-stage]')
    const rect = el?.getBoundingClientRect()
    if (rect && rect.width > 0 && rect.height > 0) return { w: rect.width, h: rect.height }
    return { w: REF_STAGE_H, h: REF_STAGE_H }
  }
  return { w: REF_STAGE_H * ASPECT_RATIO[aspect], h: REF_STAGE_H }
}

/** 출력 크기. H.264는 가로세로가 짝수여야 해서 둘 다 짝수로 맞춘다 */
export function outputSize(aspect: ExportAspect, width: number): { w: number; h: number } {
  const stage = stageSizeFor(aspect)
  const even = (v: number) => Math.max(2, Math.round(v / 2) * 2)
  return { w: even(width), h: even((width * stage.h) / stage.w) }
}

/** 현재 설정으로 저장했을 때의 길이 (옵션 패널에서 미리 보여줌) */
export function estimatePlan(opts: Pick<ExportOptions, 'fps' | 'push' | 'maxSeconds'>): Plan {
  const s = useSwingStore.getState()
  return planDuration(buildExportInput(s, opts.push), opts.fps, opts.maxSeconds)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('이미지를 불러오지 못했습니다'))
    img.src = src
  })
}

const nextTick = () => new Promise<void>((r) => setTimeout(r, 0))

/**
 * 한 번 밀었을 때의 흔들림을 영상(MP4)/GIF로 만든다.
 * 화면을 녹화하지 않고, 같은 움직임 계산(sim)을 일정한 시간 간격으로 돌려 canvas에 직접 그려서
 * 실시간 성능과 상관없이 매끄럽고 매번 똑같은 결과가 나온다.
 */
export async function exportSwing(
  opts: ExportOptions,
  onProgress: (p: ExportProgress) => void,
  cancel: { cancelled: boolean },
): Promise<ExportResult> {
  const state = useSwingStore.getState()
  const assets = useLibraryStore.getState().assets
  const stage = stageSizeFor(opts.aspect)
  const { w: outW, h: outH } = outputSize(opts.aspect, opts.width)

  onProgress({ phase: 'prepare', done: 0, total: 1 })
  const input = buildExportInput(state, opts.push)
  const plan = planDuration(input, opts.fps, opts.maxSeconds)
  const frameCount = Math.max(2, Math.ceil(plan.seconds * opts.fps))

  // 이미지를 미리 모두 불러옴 (같은 주소는 한 번만)
  const cache = new Map<string, Promise<HTMLImageElement>>()
  const load = (src: string) => {
    if (!cache.has(src)) cache.set(src, loadImage(src))
    return cache.get(src)!
  }
  const images = new Map<string, HTMLImageElement>()
  await Promise.all(state.layers.map(async (l) => images.set(l.id, await load(l.src))))
  const urlOf = (id: string | null) => assets.find((a) => a.id === id)?.url
  const bgUrl = urlOf(state.bgAssetId)
  const ribbonUrl = urlOf(state.ribbonAssetId)

  const frames = new Map(
    state.characters.map((c) => [
      c.id,
      layoutFor(
        state.groups.filter((g) => g.characterId === c.id),
        state.layers.filter((l) => l.characterId === c.id),
        state.trim,
      ),
    ]),
  )
  const layersByCharacter = new Map(
    state.characters.map((c) => [
      c.id,
      state.layers.filter((l) => l.characterId === c.id).sort((a, b) => a.zIndex - b.zIndex),
    ]),
  )
  const snap: SceneSnapshot = {
    stageW: stage.w,
    stageH: stage.h,
    zoom: state.zoom,
    ribbonLength: state.ribbonLength,
    ribbonWidth: state.ribbonWidth,
    spacing: state.spacing,
    bgColor: state.bgColor,
    bgFit: state.bgFit,
    bgImage: bgUrl ? await load(bgUrl) : null,
    ribbonImage: ribbonUrl ? await load(ribbonUrl) : null,
    popEffect: state.popEffect,
    characters: state.characters.map((c, i) => ({
      id: c.id,
      attachY: c.attachY,
      reactedAt: input.characters[i].reactedAt,
    })),
    frames,
    layersByCharacter,
    images,
  }

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d', { willReadFrequently: opts.format === 'gif' })
  if (!ctx) throw new Error('이 브라우저에서는 그림을 그릴 수 없어요')

  /** 가상 시간 i번째 프레임을 canvas에 그림 */
  const dt = 1 / opts.fps
  const startCook = getCook()
  const drawAll = async (visit: (i: number) => Promise<void>, step: number, phase: ExportProgress['phase']) => {
    const sim = createSimulation()
    let cook = startCook // 지금 화면에서 익은 정도에서 시작해 불이 켜져 있으면 계속 익음
    for (let i = 0; i < frameCount; i++) {
      if (cancel.cancelled) throw new Error('CANCELLED')
      const now = i * dt * 1000
      const pose = sim.step(input, now, dt) // 모든 프레임에서 진행해야 결과가 같음 (건너뛴 프레임도 계산은 함)
      cook = cookStep(cook, state.fireOn, dt)
      if (i % step !== 0) continue
      renderFrame(ctx, snap, pose, now, outW, outH, { fire: state.fireOn, cook })
      await visit(i)
      onProgress({ phase, done: i + 1, total: frameCount })
    }
  }

  let sink: FrameSink
  if (opts.format === 'mp4') {
    sink = await createMp4Sink(outW, outH, opts.fps)
  } else {
    // GIF: 먼저 일부 프레임으로 공통 팔레트를 만들고, 다시 돌면서 인코딩
    const samples: Uint8ClampedArray[] = []
    await drawAll(
      async () => {
        samples.push(ctx.getImageData(0, 0, outW, outH).data)
        await nextTick()
      },
      Math.max(1, Math.floor(frameCount / 10)),
      'palette',
    )
    sink = createGifSink(outW, outH, opts.fps, buildPalette(samples))
  }

  await drawAll((i) => sink.add(canvas, i), 1, 'encode')
  onProgress({ phase: 'finish', done: frameCount, total: frameCount })
  const blob = await sink.finish()
  return { blob, ext: opts.format, seconds: frameCount / opts.fps, frames: frameCount, width: outW, height: outH, capped: plan.capped }
}
