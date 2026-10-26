import type { AppInfo } from '../app/apps'

type Props = { app: AppInfo; onOpen: () => void }

/** 홈 화면의 앱 카드 한 장 */
function AppCard({ app, onOpen }: Props) {
  const ready = !!app.component
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative flex flex-col items-center gap-2 rounded-2xl border border-pink-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-pink-400 hover:shadow-md"
    >
      {!ready && (
        <span className="absolute right-2 top-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
          준비 중
        </span>
      )}
      <span className="text-4xl">{app.emoji}</span>
      <span className="font-bold text-pink-600">{app.title}</span>
      <span className="text-xs text-gray-500">{app.description}</span>
    </button>
  )
}

export default AppCard
