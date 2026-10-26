import { useEffect } from 'react'
import { CharacterRoster } from '../../shared/character/PartsUploader'
import { useCharacterStore } from '../../shared/character/useCharacterStore'
import AppShell from '../../shared/loop/AppShell'
import type { DrawFn } from '../../shared/loop/useLoopPlayer'
import { useLoopSettings } from '../../shared/loop/useLoopSettings'
import BoxOptions from './components/BoxOptions'
import { SECONDS_PER_CHARACTER } from './config'
import { drawDeliveryBox } from './scene/drawDeliveryBox'
import { useBoxStore } from './store/useBoxStore'

const draw: DrawFn = (ctx, t, loop) => drawDeliveryBox(ctx, t, loop, useBoxStore.getState().cfg, useCharacterStore.getState().characters)

/** 택배 박스 앱: 박스에 담긴 캐릭터가 차례로 등장해 잠깐 머문 뒤 컨베이어로 슝 빠져나가는 루프 */
function DeliveryBoxApp() {
  const count = useCharacterStore((s) => s.characters.length)

  // 들어올 때의 루프 길이를 기억해 두었다가 나갈 때 되돌림 (아래 효과보다 먼저 실행돼야 함)
  useEffect(() => {
    const prev = useLoopSettings.getState().loopSec
    return () => useLoopSettings.getState().setLoopSec(prev)
  }, [])
  // 인원이 바뀌면 한 명당 기본 시간(3초)만큼 루프를 맞춤
  useEffect(() => {
    useLoopSettings.getState().setLoopSec(Math.min(30, count * SECONDS_PER_CHARACTER))
  }, [count])

  return (
    <AppShell title="택배 박스" emoji="📦" draw={draw}>
      <CharacterRoster />
      <BoxOptions />
    </AppShell>
  )
}

export default DeliveryBoxApp
