import { useEffect, useState } from 'react'

/** 해시 주소(`#/ribbon-swing`)에서 앱 id를 읽음. 빈 주소면 null = 홈 */
function readRoute(): string | null {
  const id = window.location.hash.replace(/^#\/?/, '')
  return id || null
}

export function goHome() {
  window.location.hash = ''
}

export function goApp(id: string) {
  window.location.hash = `/${id}`
}

/** 현재 주소의 앱 id (홈이면 null). 정적 호스팅(GitHub Pages)에서도 새로고침이 안 깨지도록 해시 방식 */
export function useRoute(): string | null {
  const [route, setRoute] = useState(readRoute)
  useEffect(() => {
    const onChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
