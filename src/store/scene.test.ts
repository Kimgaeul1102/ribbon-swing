import { describe, expect, it } from 'vitest'
import { pickSceneParams, useSwingStore } from './useSwingStore'

describe('컨셉(장면) 설정 값', () => {
  it('배경/리본/슬라이더 값은 담고, 인원·레이어는 따로 저장하니 담지 않음', () => {
    const p = pickSceneParams(useSwingStore.getState()) as Record<string, unknown>
    for (const key of ['bgColor', 'bgAssetId', 'bgFit', 'ribbonAssetId', 'ribbonLength', 'ribbonWidth', 'zoom', 'amplitude']) {
      expect(p).toHaveProperty(key)
    }
    for (const key of ['layers', 'groups', 'characters', 'stopAt']) {
      expect(p).not.toHaveProperty(key)
    }
  })
})

describe('리본 그림 선택', () => {
  it('그림을 고르면 굵기가 넓어지고 해제하면 기본 끈 굵기로 돌아감', () => {
    const { setRibbonAsset, setParam } = useSwingStore.getState()
    setRibbonAsset(null)
    const plain = useSwingStore.getState().ribbonWidth
    setRibbonAsset('img1')
    expect(useSwingStore.getState().ribbonWidth).toBeGreaterThan(plain)
    setRibbonAsset(null)
    expect(useSwingStore.getState().ribbonWidth).toBe(plain)

    // 그림에서 다른 그림으로 바꿀 땐 사용자가 정한 굵기를 유지
    setRibbonAsset('img1')
    setParam('ribbonWidth', 60)
    setRibbonAsset('img2')
    expect(useSwingStore.getState().ribbonWidth).toBe(60)
    setRibbonAsset(null)
  })
})
