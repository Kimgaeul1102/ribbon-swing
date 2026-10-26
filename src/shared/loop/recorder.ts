const MIME_CANDIDATES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']

/** 캔버스를 durationMs 동안 녹화해서 WebM Blob으로 돌려줌 (브라우저가 MediaRecorder를 지원해야 함) */
export function recordCanvas(canvas: HTMLCanvasElement, durationMs: number, fps: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof MediaRecorder === 'undefined') {
      reject(new Error('이 브라우저는 녹화(MediaRecorder)를 지원하지 않아요.'))
      return
    }
    const mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m))
    const stream = canvas.captureStream(fps)
    const recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 8_000_000 })
    const chunks: BlobPart[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    recorder.onerror = () => reject(new Error('녹화 중 오류가 났어요.'))
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop())
      resolve(new Blob(chunks, { type: mimeType ?? 'video/webm' }))
    }
    recorder.start()
    setTimeout(() => recorder.stop(), durationMs)
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
