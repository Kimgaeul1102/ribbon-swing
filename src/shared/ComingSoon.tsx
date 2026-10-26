import BackToHome from './BackToHome'

type Props = { title: string; description: string }

/** 아직 안 만든 앱을 눌렀을 때 보이는 화면 */
function ComingSoon({ title, description }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-5xl">🚧</div>
      <h1 className="text-xl font-bold text-pink-600">{title}</h1>
      <p className="max-w-sm text-sm text-gray-500">{description}</p>
      <p className="text-sm text-gray-500">아직 준비 중이에요.</p>
      <BackToHome />
    </div>
  )
}

export default ComingSoon
