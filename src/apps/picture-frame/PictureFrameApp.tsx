import { useCharacterStore } from '../../shared/character/useCharacterStore'
import { SingleCharacterUploader } from '../../shared/character/PartsUploader'
import AppShell from '../../shared/loop/AppShell'
import type { DrawFn } from '../../shared/loop/useLoopPlayer'
import FrameOptions from './components/FrameOptions'
import { drawPictureFrame } from './scene/drawPictureFrame'
import { useFrameStore } from './store/useFrameStore'

const draw: DrawFn = (ctx, t, loop) => drawPictureFrame(ctx, t, loop, useFrameStore.getState().cfg, useCharacterStore.getState().characters[0])

/** 액자 앱: 액자 속에 갇혀 유리를 톡톡 두드리는 루프 */
function PictureFrameApp() {
  return (
    <AppShell title="액자 두드리기" emoji="🖼️" draw={draw}>
      <SingleCharacterUploader />
      <FrameOptions />
    </AppShell>
  )
}

export default PictureFrameApp
