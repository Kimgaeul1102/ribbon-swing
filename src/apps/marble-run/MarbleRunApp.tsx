import BackToHome from '../../shared/BackToHome'
import CharacterList from './components/CharacterList'
import PhysicsSettings from './components/PhysicsSettings'
import RaceControls from './components/RaceControls'
import Stage from './components/Stage'
import './marble-run.css'

/** 마블런 앱: 왼쪽 레이스 화면 + 오른쪽 컨트롤 (모바일은 하단 시트) */
function MarbleRunApp() {
  return (
    <div className="flex h-full flex-col md:flex-row">
      <main className="relative min-h-0 flex-1">
        <Stage />
      </main>
      <aside className="flex max-h-[50%] w-full flex-col border-t border-pink-200 bg-white md:max-h-none md:w-80 md:border-l md:border-t-0">
        <div className="border-b border-pink-100 p-3">
          <div className="mb-2 flex items-center justify-between">
            <BackToHome />
            <span className="text-sm font-bold text-pink-600">🔮 마블런</span>
          </div>
          <RaceControls />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
          <CharacterList />
          <PhysicsSettings />
        </div>
      </aside>
    </div>
  )
}

export default MarbleRunApp
