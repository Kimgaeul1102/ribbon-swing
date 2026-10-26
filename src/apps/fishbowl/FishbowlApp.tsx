import { useCharacterStore } from '../../shared/character/useCharacterStore'
import { SingleCharacterUploader } from '../../shared/character/PartsUploader'
import AppShell from '../../shared/loop/AppShell'
import type { DrawFn } from '../../shared/loop/useLoopPlayer'
import FishbowlOptions from './components/FishbowlOptions'
import { drawFishbowl } from './scene/drawFishbowl'
import { useFishbowlStore } from './store/useFishbowlStore'

/** 매 프레임 최신 설정을 읽어 그림 (React 리렌더 없음) */
const draw: DrawFn = (ctx, t, loop) => drawFishbowl(ctx, t, loop, useFishbowlStore.getState().cfg, useCharacterStore.getState().characters[0])

/** 어항 앱: 캐릭터가 어항 속에 떠서 거품을 내는 루프 */
function FishbowlApp() {
  return (
    <AppShell title="어항" emoji="🐠" draw={draw}>
      <SingleCharacterUploader />
      <FishbowlOptions />
    </AppShell>
  )
}

export default FishbowlApp
