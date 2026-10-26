import { CharacterRoster } from '../../shared/character/PartsUploader'
import { useCharacterStore } from '../../shared/character/useCharacterStore'
import AppShell from '../../shared/loop/AppShell'
import type { DrawFn } from '../../shared/loop/useLoopPlayer'
import ShelfOptions from './components/ShelfOptions'
import { drawJarShelf } from './scene/drawJarShelf'
import { useShelfStore } from './store/useShelfStore'

const draw: DrawFn = (ctx, t, loop) => drawJarShelf(ctx, t, loop, useShelfStore.getState().cfg, useCharacterStore.getState().characters)

/** 병조림 선반 앱: 여러 캐릭터가 각자 병에 담겨 진열된 다인 커미션용 루프 */
function JarShelfApp() {
  return (
    <AppShell title="병조림 선반" emoji="🫙" draw={draw}>
      <CharacterRoster />
      <ShelfOptions />
    </AppShell>
  )
}

export default JarShelfApp
