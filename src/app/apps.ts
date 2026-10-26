import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/** 홈 화면에 나오는 앱 한 개. 새 앱은 여기에 한 줄 추가하고 `src/apps/<id>/`에 폴더를 만들면 됨 */
export type AppInfo = {
  id: string // 주소(#/id)와 폴더 이름
  title: string
  emoji: string
  description: string
  /** 만들어진 앱만 지정. 없으면 "준비 중" 화면 */
  component?: LazyExoticComponent<ComponentType>
}

export const APPS: AppInfo[] = [
  {
    id: 'ribbon-swing',
    title: '리본스윙',
    emoji: '🎀',
    description: '리본에 매달려 흔들리는 캐릭터 움짤',
    component: lazy(() => import('../apps/ribbon-swing/RibbonSwingApp')),
  },
  {
    id: 'marble-run',
    title: '마블런',
    emoji: '🔮',
    description: '캐릭터 구슬이 트랙을 굴러 내려오는 레이스',
    component: lazy(() => import('../apps/marble-run/MarbleRunApp')),
  },
  {
    id: 'fishbowl',
    title: '어항',
    emoji: '🐠',
    description: '어항 속에 둥둥 떠서 거품을 뽀글거리는 캐릭터',
    component: lazy(() => import('../apps/fishbowl/FishbowlApp')),
  },
  {
    id: 'delivery-box',
    title: '택배 박스',
    emoji: '📦',
    description: '컨베이어 벨트 위 박스에 담겨 덜컹거리는 캐릭터',
    component: lazy(() => import('../apps/delivery-box/DeliveryBoxApp')),
  },
  {
    id: 'jar-shelf',
    title: '병조림 선반',
    emoji: '🫙',
    description: '유리병에 담겨 선반에 진열된 여러 캐릭터',
    component: lazy(() => import('../apps/jar-shelf/JarShelfApp')),
  },
  {
    id: 'police-car',
    title: '경찰차 뒷좌석',
    emoji: '🚓',
    description: '경찰차 뒷좌석에서 창밖을 바라보는 시무룩한 캐릭터',
    component: lazy(() => import('../apps/police-car/PoliceCarApp')),
  },
  {
    id: 'picture-frame',
    title: '액자 두드리기',
    emoji: '🖼️',
    description: '액자 안에서 유리를 톡톡 두드리는 캐릭터',
    component: lazy(() => import('../apps/picture-frame/PictureFrameApp')),
  },
]
