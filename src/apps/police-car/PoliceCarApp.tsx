import { useCharacterStore } from '../../shared/character/useCharacterStore'
import { SingleCharacterUploader } from '../../shared/character/PartsUploader'
import AppShell from '../../shared/loop/AppShell'
import type { DrawFn } from '../../shared/loop/useLoopPlayer'
import PoliceOptions from './components/PoliceOptions'
import { drawPoliceCar } from './scene/drawPoliceCar'
import { usePoliceStore } from './store/usePoliceStore'

const draw: DrawFn = (ctx, t, loop) => drawPoliceCar(ctx, t, loop, usePoliceStore.getState().cfg, useCharacterStore.getState().characters[0])

/** 경찰차 뒷좌석 앱: 수갑 찬 채 창밖을 바라보는 시무룩한 루프 */
function PoliceCarApp() {
  return (
    <AppShell title="경찰차 뒷좌석" emoji="🚓" draw={draw}>
      <SingleCharacterUploader />
      <PoliceOptions />
    </AppShell>
  )
}

export default PoliceCarApp
