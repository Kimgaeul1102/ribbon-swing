import { Suspense } from 'react'
import HomePage from '../home/HomePage'
import ComingSoon from '../shared/ComingSoon'
import { useRoute } from '../shared/route'
import { APPS } from './apps'

/** 주소에 맞는 화면을 보여줌: 홈 / 앱 / 준비 중 / 없는 주소는 홈 */
function AppRouter() {
  const route = useRoute()
  const app = APPS.find((a) => a.id === route)
  if (!app) return <HomePage />
  if (!app.component) return <ComingSoon title={app.title} description={app.description} />
  const Component = app.component
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-gray-500">불러오는 중…</div>}>
      <Component />
    </Suspense>
  )
}

export default AppRouter
