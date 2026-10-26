import { goHome } from './route'

/** 모든 앱 화면에서 홈으로 돌아가는 버튼 */
function BackToHome() {
  return (
    <button
      type="button"
      onClick={goHome}
      className="rounded-full border border-pink-300 px-3 py-0.5 text-xs text-pink-600 hover:bg-pink-50"
    >
      ← 홈
    </button>
  )
}

export default BackToHome
