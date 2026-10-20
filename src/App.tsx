import { useEffect } from 'react'
import Stage from './components/Stage'
import ControlPanel from './components/ControlPanel'
import CharacterBar from './components/CharacterBar'
import LayerList from './components/LayerList'
import LibraryPanel from './components/LibraryPanel'
import { useLibraryStore } from './store/useLibraryStore'

function App() {
  const initLibrary = useLibraryStore((s) => s.init)
  useEffect(() => {
    void initLibrary()
  }, [initLibrary])

  return (
    <div className="flex h-full flex-col md:flex-row">
      <main className="relative min-h-0 flex-1">
        <Stage />
      </main>
      {/* 모바일(<768px)에서는 하단 시트, 데스크톱에서는 우측 패널 */}
      <aside className="max-h-[45%] w-full overflow-y-auto border-t border-pink-200 bg-white p-4 md:max-h-none md:w-80 md:border-l md:border-t-0">
        <ControlPanel />
        <CharacterBar />
        <LayerList />
        <LibraryPanel />
      </aside>
    </div>
  )
}

export default App
