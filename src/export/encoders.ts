import { ArrayBufferTarget, Muxer } from 'mp4-muxer'
import { GIFEncoder, applyPalette, quantize } from 'gifenc'

/** 프레임이 그려진 canvas를 받아 파일로 만드는 인코더 */
export type FrameSink = {
  add: (canvas: HTMLCanvasElement, index: number) => Promise<void>
  finish: () => Promise<Blob>
}

const tick = () => new Promise<void>((r) => setTimeout(r, 2))

/** MP4(H.264) — 브라우저의 WebCodecs를 쓴다. 지원하지 않으면 Error('MP4_UNSUPPORTED') */
export async function createMp4Sink(w: number, h: number, fps: number): Promise<FrameSink> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') throw new Error('MP4_UNSUPPORTED')
  const bitrate = Math.min(12_000_000, Math.max(1_000_000, Math.round(w * h * fps * 0.2)))
  // 큰 화면은 높은 레벨의 H.264 프로필이 필요. 안 되는 기기를 위해 여러 후보를 차례로 시험
  const candidates = Math.max(w, h) > 1280 ? ['avc1.640028', 'avc1.4d0028', 'avc1.42001f'] : ['avc1.42001f', 'avc1.4d001f', 'avc1.640028']
  let config: VideoEncoderConfig | null = null
  for (const codec of candidates) {
    const c: VideoEncoderConfig = { codec, width: w, height: h, bitrate, framerate: fps }
    if ((await VideoEncoder.isConfigSupported(c)).supported) {
      config = c
      break
    }
  }
  if (!config) throw new Error('MP4_UNSUPPORTED')

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: w, height: h },
    fastStart: 'in-memory',
  })
  let failure: Error | null = null
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      failure = e
    },
  })
  encoder.configure(config)

  return {
    add: async (canvas, index) => {
      while (encoder.encodeQueueSize > 8) await tick() // 인코더가 밀리지 않게 잠깐 기다림
      if (failure) throw failure
      const frame = new VideoFrame(canvas, {
        timestamp: Math.round((index * 1_000_000) / fps),
        duration: Math.round(1_000_000 / fps),
      })
      encoder.encode(frame, { keyFrame: index % (fps * 2) === 0 })
      frame.close()
    },
    finish: async () => {
      await encoder.flush()
      if (failure) throw failure
      muxer.finalize()
      return new Blob([muxer.target.buffer], { type: 'video/mp4' })
    },
  }
}

/**
 * 모든 프레임이 함께 쓰는 256색 팔레트를 만든다 (프레임마다 따로 만들면 색이 깜빡임).
 * 샘플 프레임들의 픽셀을 일부만 모아서 한 번에 양자화.
 */
export function buildPalette(samples: Uint8ClampedArray[]): number[][] {
  const STRIDE = 3 // 픽셀 3개 중 1개만 씀
  const total = samples.reduce((n, s) => n + Math.floor(s.length / 4 / STRIDE), 0)
  const merged = new Uint8Array(total * 4)
  let o = 0
  for (const s of samples) {
    for (let p = 0; p + 3 < s.length; p += 4 * STRIDE) {
      merged[o++] = s[p]
      merged[o++] = s[p + 1]
      merged[o++] = s[p + 2]
      merged[o++] = s[p + 3]
    }
  }
  return quantize(merged.subarray(0, o), 256, { format: 'rgb565' })
}

/** GIF — 공통 팔레트로 인코딩 (끝없이 반복) */
export function createGifSink(w: number, h: number, fps: number, palette: number[][]): FrameSink {
  const gif = GIFEncoder()
  const delay = Math.round(1000 / fps)
  return {
    add: async (canvas) => {
      const data = canvas.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, w, h).data
      gif.writeFrame(applyPalette(data, palette, 'rgb565'), w, h, { palette, delay, repeat: 0 })
      await tick()
    },
    finish: async () => {
      gif.finish()
      return new Blob([gif.bytes().slice()], { type: 'image/gif' }) // slice: 공유 버퍼가 아닌 복사본으로
    },
  }
}
