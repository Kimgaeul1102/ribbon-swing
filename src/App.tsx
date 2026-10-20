import { useEffect, useState } from 'react'
import Stage from './components/Stage'
import ActionBar from './components/ActionBar'
import CharacterBar from './components/CharacterBar'
import LayerList from './components/LayerList'
import LibraryPanel from './components/LibraryPanel'
import MotionPanel from './components/MotionPanel'
import RibbonPanel from './components/RibbonPanel'
import ScreenPanel from './components/ScreenPanel'
import ScenePanel from './components/ScenePanel'
import { useLibraryStore } from './store/useLibraryStore'

const TABS = [
  { id: 'layers', label: '인원·레이어' },
  { id: 'motion', label: '움직임' },
  { id: 'ribbon', label: '리본' },
  { id: 'screen', label: '배경·화면' },
  { id: 'scene', label: '컨셉' },
] as const

type TabId = (typeof TABS)[number]['id']

const TAB_KEY = 'ribbon-swing:tab'

/** 마지막으로 보던 탭을 기억 (저장소를 못 쓰는 환경에서도 동작하도록 try/catch) */
function loadTab(): TabId {
  try {
    const saved = localStorage.getItem(TAB_KEY)
    if (TABS.some((t) => t.id === saved)) return saved as TabId
  } catch {
    /* 무시 */
  }
  return 'layers'
}

function App() {
  const initLibrary = useLibraryStore((s) => s.init)
  const [tab, setTab] = useState<TabId>(loadTab)

  useEffect(() => {
    void initLibrary()
  }, [initLibrary])

  const selectTab = (id: TabId) => {
    setTab(id)
    try {
      localStorage.setItem(TAB_KEY, id)
    } catch {
      /* 무시 */
    }
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      <main className="relative min-h-0 flex-1">
        <Stage />
      </main>
      {/* 모바일(<768px)에서는 하단 시트, 데스크톱에서는 우측 패널. 위쪽 버튼 줄은 어느 탭에서든 보임 */}
      <aside className="flex max-h-[50%] w-full flex-col border-t border-pink-200 bg-white md:max-h-none md:w-80 md:border-l md:border-t-0">
        <div className="border-b border-pink-100 p-3">
          <ActionBar />
        </div>
        <nav className="flex shrink-0 overflow-x-auto border-b border-pink-100" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => selectTab(t.id)}
              className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm ${
                tab === t.id
                  ? 'border-pink-500 font-bold text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-pink-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto p-4" role="tabpanel">
          {tab === 'layers' && (
            <>
              <CharacterBar />
              <LayerList />
              <LibraryPanel />
            </>
          )}
          {tab === 'motion' && <MotionPanel />}
          {tab === 'ribbon' && <RibbonPanel />}
          {tab === 'screen' && <ScreenPanel />}
          {tab === 'scene' && <ScenePanel />}
        </div>
      </aside>
    </div>
  )
}

export default App
