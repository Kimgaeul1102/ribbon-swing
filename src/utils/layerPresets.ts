import type { Expression, Layer } from '../store/useSwingStore'
import { newId } from './id'
import type { Box, Size } from './trim'

type LayerPreset = Pick<Layer, 'pivot' | 'delay' | 'speedMul' | 'amplitudeMul' | 'stiffness' | 'waveMul' | 'swayMul'>

const TOP_CENTER = { x: 0.5, y: 0 }

const EFFECTS = { speedMul: 1, waveMul: 1, swayMul: 1 } // 효과는 기본적으로 전체 설정 그대로

const BODY: LayerPreset = { pivot: TOP_CENTER, delay: 0, amplitudeMul: 1.0, stiffness: 1.0, ...EFFECTS }
const HAIR: LayerPreset = { pivot: TOP_CENTER, delay: 80, amplitudeMul: 1.4, stiffness: 0.15, ...EFFECTS }
const TIE: LayerPreset = { pivot: TOP_CENTER, delay: 120, amplitudeMul: 1.8, stiffness: 0.1, ...EFFECTS }
const ACCESSORY: LayerPreset = { pivot: TOP_CENTER, delay: 50, amplitudeMul: 1.2, stiffness: 0.3, ...EFFECTS }

const RULES: { pattern: RegExp; preset: LayerPreset }[] = [
  { pattern: /hair|머리|헤어/i, preset: HAIR },
  { pattern: /tie|넥타이|타이/i, preset: TIE },
  { pattern: /acc|ribbon|액세서리|악세|리본|장신구/i, preset: ACCESSORY },
]

/** 파일/레이어 이름으로 프리셋 추측. 모르면 본체처럼 딱 붙어서 움직임(옷 등) */
export function guessPreset(name: string): LayerPreset {
  const rule = RULES.find((r) => r.pattern.test(name))
  const p = rule ? rule.preset : BODY
  return { ...p, pivot: { ...p.pivot } }
}

/** 이름으로 표시 조건 추측: hit/놀람 등은 밀렸을 때만, normal/평소 등은 평소에만 */
export function guessExpression(name: string): Expression {
  if (/hit|ouch|surpris|shock|놀람|놀란|당황|밀림|아야/i.test(name)) return 'hit'
  if (/normal|평소|기본표정|무표정/i.test(name)) return 'normal'
  return 'always'
}

export function createLayer(
  asset: { id: string; name: string; url: string; canvas: Size; bbox: Box },
  zIndex: number,
  characterId: string,
  attachY = 0, // 이 인원의 끈이 달린 높이 — 새 레이어의 회전 기준점 높이로 씀
): Layer {
  return {
    id: newId(),
    characterId,
    expression: guessExpression(asset.name),
    assetId: asset.id,
    name: asset.name,
    src: asset.url,
    canvas: asset.canvas,
    bbox: asset.bbox,
    zIndex,
    enabled: true,
    ...guessPreset(asset.name),
    pivot: { x: guessPreset(asset.name).pivot.x, y: attachY },
  }
}
