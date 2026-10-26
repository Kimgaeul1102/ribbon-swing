import { APPS } from '../app/apps'
import { goApp } from '../shared/route'
import AppCard from './AppCard'

/** 홈: 만들 움짤 종류를 고르는 화면 */
function HomePage() {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 p-6">
      <header className="pt-4 text-center">
        <h1 className="text-2xl font-bold text-pink-600">🎀 SD 캐릭터 움짤 공방</h1>
        <p className="mt-1 text-sm text-gray-500">어떤 움짤을 만들어 볼까요?</p>
      </header>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {APPS.map((app) => (
          <AppCard key={app.id} app={app} onOpen={() => goApp(app.id)} />
        ))}
      </div>
    </div>
  )
}

export default HomePage
