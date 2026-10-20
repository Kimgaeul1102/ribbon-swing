markdown
# 🎀 Ribbon Swing — 프로젝트 안내 (CLAUDE.md)

## 1. 한 줄 요약
사용자가 캐릭터 이미지(레이어별 PNG)를 업로드하면, 캐릭터가 리본에 매달려 좌우로 흔들리는
반응형 웹 앱. 흔들림의 **세기 / 속도 / 꿀렁임(젤리감)** 을 슬라이더로 조절할 수 있고,
머리카락·넥타이 같은 **하위 레이어는 본체보다 살짝 늦게 따라오는 2차 움직임**을 가진다.

## 2. 기술 스택 (권장)
| 영역 | 선택 | 이유 |
|---|---|---|
| 빌드 | **Vite + React 18 + TypeScript** | 가볍고 빠름, 상태관리/컴포넌트 구조가 명확 |
| 애니메이션 | **requestAnimationFrame + CSS transform** (직접 구현) | 물리(감쇠 진자) 수식을 직접 제어해야 하므로 라이브러리보다 수동 루프가 적합 |
| 상태관리 | **Zustand** | 슬라이더 값·레이어 목록을 전역으로 가볍게 공유 |
| 스타일 | **Tailwind CSS** | 반응형 레이아웃 빠르게 |
| 이미지 처리 | 브라우저 `FileReader` / `URL.createObjectURL` | 서버 없이 클라이언트 전용 |
| 배포 | Vercel 또는 GitHub Pages | 정적 사이트 |

> 꿀렁임을 "진짜 메시 변형"으로 업그레이드할 때만 **PixiJS (SimpleRope / Mesh)** 도입 검토.
> 1차 버전은 CSS `skewX` + `scaleY` 조합으로 충분.

## 3. 핵심 동작 원리
### 3.1 감쇠 진자 (메인 스윙)

angle(t) = A · e^(−d·t) · sin(2π·f·t)

- `A` = 세기(amplitude, deg, 0~45)
- `f` = 속도(frequency, Hz, 0.2~2.0)
- `d` = 감쇠(damping, 0~1). 0이면 영원히 흔들림, 클수록 빨리 멈춤
- **밀기는 리셋이 아니라 충격을 더하는 방식**: 레이어마다 감쇠 진동 상태(각도 x, 각속도 v)를 시뮬레이션하고(`oscillator`/`stepSpring`), 밀면 `v += A·ω` (`applyPush`, 지금 움직이는 방향으로, 멈춰 있으면 오른쪽, 속도 상한 있음). 정지 상태에서 한 번 밀면 위 수식과 같은 궤적이고, 흔들리는 중에 또 누르면 초반으로 돌아가지 않고 그 위에 힘이 얹힘
- **멈추기**: 계속 흔들기를 끄고, 진동에 브레이크(속도·각도 감쇠 1.2초)를 걸고, 예약된 밀기(차례대로 밀기)를 취소 (`stopAt` 변화를 루프가 감지)
- (마우스 드래그로 밀기는 미구현 — 필요 없다고 해서 뺌)
- 회전 기준점(`transform-origin`)은 **리본이 캐릭터에 묶인 지점** (기본값: 상단 중앙)

### 3.2 말랑함 + 아래로 갈수록 (전부 CSS transform — 가벼움)
> SVG 필터(feDisplacementMap)로 물결/휨을 그리던 방식은 매 프레임 다시 그려져서 렉이 심해 폐기했다. 필터/띠 방식은 다시 쓰지 말 것.
- 레이어 transform: `rotate(angle) skewX(sway) scale(1 − jelly·0.6, 1 + jelly)`, `transform-origin`은 pivot, `will-change: transform`
- **아래로 갈수록(sway)**: `skewX = −sin(layerAngle) · 14° · sway` 를 부족감쇠 스프링(`stepSpring`, ω=13, ζ=0.35)으로 따라감. pivot이 위쪽이라 아래로 갈수록 많이 움직이고, 스프링 덕에 부드럽게 출렁임
- **말랑함(wobble)**: `jelly = wobble · 0.06 · tanh(|각속도|/120)` 를 스프링(ω=16, ζ=0.3)으로 따라감 → 빠르게 움직일 때 세로로 늘어났다가 통통 튀며 돌아옴 (멈추면 0)
- `wobble`, `sway` 슬라이더 0~1
- **레이어 폴더 + 투명 여백 자르기**: 한 번에 올린 이미지는 폴더(`LayerGroup`) 하나로 묶여 같은 여백(멤버 불투명 영역 bbox 합집합 = `crop`)으로 함께 잘린다. crop은 폴더를 만들 때 한 번 계산해서 **고정**(`utils/groups.ts computeCrop`) — 나중에 폴더를 더하거나 레이어를 숨겨도 이미 올린 그림이 움직이지 않음. 파일 자체는 안 자르고 화면 위치만 옮김. 캔버스 크기가 제각각이면 그 폴더는 안 자름
- **프레임(`utils/frame.ts`)**: 인원의 **맨 처음 올린 폴더**(`createdAt` 최소)의 crop이 화면 크기·위치의 기준. 같은 캔버스 크기의 다른 폴더는 원본 위치 그대로 겹쳐 입혀지고(옷 폴더 등), 크기가 다른 폴더는 자기 영역을 프레임 높이에 맞춰 가운데 정렬. pivot은 프레임 기준 비율
- 레이어 목록은 폴더 단위(접고 펴기, 폴더 전체 켜고 끄기, ▲▼ 폴더 이동, 삭제, 이름 변경). 폴더 안 레이어는 ⋮로 따로 설정. 세트에도 폴더 구성이 저장됨(폴더 생기기 전 세트는 세트 전체가 폴더 하나)
- 인원 간격(`spacing`, 0.2~1)은 `utils/layout.ts`가 계산. 줄이면 인원이 가운데로 모임

### 3.2.2 계속 흔들기 (idle)
- 버튼으로 켜고 끄면 밀지 않아도 잔잔하게 계속 흔들림. 세기 슬라이더 0~20° (`idleStrength`), 속도는 전체 `frequency`의 0.6배
- `idleAngle(t) = strength · (0.75·sin(w·t+p) + 0.25·sin(1.618·w·t+…)) · breath` — 배수가 아닌 두 주기 + 느린 세기 변화로 기계처럼 반복되지 않음
- 인원마다 `seedFromId(id)`로 위상이 달라 따로 흔들림. 켜고 끌 때는 세기 비율을 서서히 바꿔 튀지 않음
- 레이어 target = (밀기 진동 + idle) · amplitudeMul. 레이어의 delay/speedMul이 idle에도 똑같이 적용돼 머리카락 등이 자연스럽게 늦게 따라옴

### 3.2.3 리본 끈 흔들림 / 줌
- 인원마다 "리본 끈 + 캐릭터" 묶음(`ribbonElements`)이 위쪽 가로대(상단 중앙)를 기준으로 회전 → 끈이 매달린 채 흔들리고 캐릭터는 끈 끝에서 호를 그림. 끈 길이는 `ribbonLength`(px, 슬라이더 0~400, 기본 `DEFAULT_RIBBON_PX`=150). 끈 끝은 그림의 `attachY` 높이(인원별, 0=정수리 ~ 1=맨 아래, 슬라이더 "끈 위치")에 붙고(끈은 그림 뒤로 이어짐), 그 높이가 레이어 회전 기준점 높이(`pivot.y`)이기도 함 — `setAttachY`가 인원 모든 레이어의 pivot.y를 같이 옮김. 길이를 바꿔도 그림 크기는 그대로(크기는 줌으로 조절)
- 끈 각도 = (인원별 진동 + idle) · `ribbonSwing`(0~1). 캐릭터 전체 방향은 유지되도록 레이어 회전에서 끈 각도를 뺌 (`angle − ribbonAngle`)
- `zoom`(0.5~1.5): 무대 내용을 위쪽 중앙 기준으로 확대/축소. 배경은 Stage 바로 아래(줌 묶음 바깥)에 두면 줌의 영향을 받지 않음

### 3.2.4 탭 / 리본 그림 / 배경 / 컨셉
- 오른쪽 패널(모바일은 하단 시트)은 **위쪽 고정 버튼 줄**(밀기 2종·계속 흔들기·멈추기) + **탭**: 인원·레이어 / 움직임 / 리본 / 배경·화면 / 컨셉. 마지막으로 본 탭은 localStorage에 기억
- **리본 그림**: 보관함 이미지(`kind: 'ribbon'`)를 끈 길이만큼 세로로 늘려 채움(`object-fit: fill`). 굵기 `ribbonWidth`, 길이 `ribbonLength`. 없으면 기본 분홍 끈
- **배경**: 배경색 + 배경 그림(`kind: 'background'`, 맞춤 cover/contain/fill). 줌 묶음 바깥에 그려서 줌의 영향을 안 받음
- 보관함 이미지는 용도(`kind`: layer/ribbon/background)별로 나뉨. 같은 파일이라도 용도가 다르면 따로 저장(해시+kind로 중복 판별). 이전 버전에서 저장한 이미지는 layer
- **컨셉(장면 전체)**: `pickSceneParams`(슬라이더·리본·배경 설정) + 모든 인원/폴더/레이어를 IndexedDB `scenes`에 저장 (`saveScene`/`applyScene`). 불러오면 통째로 교체. DB 버전 2(scenes 저장소 추가, 기존 데이터 유지)

### 3.3 레이어별 2차 움직임 (Follow-through)
각 레이어는 메인 각도를 그대로 쓰지 않고 **지연 + 배율 + 자체 감쇠**를 거친다.
```ts
type Layer = {
  id: string;
  name: string;          // "body", "hair", "tie" ...
  src: string;           // object URL
  zIndex: number;
  pivot: { x: number; y: number };   // 0~1 비율, 회전 기준점
  delay: number;         // 메인보다 몇 ms 늦게 반응 (0~300)
  speedMul: number;      // 속도 배율 (0.5~1.5) — 낮을수록 천천히
  amplitudeMul: number;  // 메인 진폭 배율 (0.5~2.0)
  stiffness: number;     // 스프링 강성 (0.05~1) — 낮을수록 흐물흐물
  waveMul: number;       // 꿀렁임(물결) 배율 (0~2) — 전체 슬라이더에 곱함
  swayMul: number;       // 아래로 갈수록 배율 (0~2) — 전체 슬라이더에 곱함
  enabled: boolean;
};
```
- 구현은 **스프링 추종**: 매 프레임 `layerAngle += (targetAngle − layerAngle) · stiffness`
  여기서 `targetAngle`은 레이어 자신의 진동 값: `(osc.x + idle) · amplitudeMul`. 레이어의 `delay`만큼 늦게 충격을 받고, `speedMul`만큼 진동수·감쇠가 빠르거나 느림
- 프리셋 예시
  - body: delay 0, mul 1.0, stiffness 1.0
  - hair: delay 80, mul 1.4, stiffness 0.15
  - tie:  delay 120, mul 1.8, stiffness 0.1
  - accessory: delay 50, mul 1.2, stiffness 0.3

## 4. 화면 구성

┌───────────────────────────────┬──────────────┐
│ │ Controls │
│ [리본 SVG] │ ─────────── │
│ │ │ 세기 ───●─ │
│ [캐릭터 레이어들] │ 속도 ──●── │
│ │ 감쇠 ●──── │
│ (드래그로 밀기 가능) │ 꿀렁임 ───●─ │
│ │ ─────────── │
│ │ Layers │
│ │ ☑ body [⋮] │
│ │ ☑ hair [⋮] │
│ │ + 레이어 추가 │
└───────────────────────────────┴──────────────┘

- **모바일(< 768px)**: 컨트롤 패널이 하단 시트로 내려감
- 리본은 SVG `path`로 그리고, 끝점이 캐릭터 pivot을 따라가도록 매 프레임 갱신
- 레이어 `[⋮]` 클릭 시 해당 레이어의 delay / speedMul / amplitudeMul / stiffness / waveMul / swayMul / pivot 편집 팝오버

## 5. 폴더 구조

src/
main.tsx
App.tsx
store/useSwingStore.ts # Zustand: 전역 파라미터 + 레이어 배열
hooks/useSwingLoop.ts # rAF 루프, 진자 계산, 레이어 스프링 추종
components/
Stage.tsx # 리본 + 레이어 렌더링 영역
Ribbon.tsx # SVG 리본
CharacterLayer.tsx # 개별 레이어 <img>, transform 적용
ActionBar.tsx # 위쪽 고정 버튼 (밀기/계속 흔들기/멈추기)
MotionPanel.tsx # 움직임 탭 슬라이더
RibbonPanel.tsx # 리본 탭 (끈 길이/굵기/흔들림, 리본 그림)
ScreenPanel.tsx # 배경·화면 탭 (줌, 배경색/그림)
ScenePanel.tsx # 컨셉 탭 (장면 전체 저장/불러오기)
AssetPicker.tsx # 리본/배경 그림 고르기
SliderRow.tsx # 슬라이더 한 줄
LayerList.tsx # 레이어 추가/삭제/순서/설정
LayerSettings.tsx # 개별 레이어 설정 팝오버
CharacterBar.tsx # 인원 탭 (+ 인원 추가/이름 변경/삭제). 선택된 인원이 Layers·세트의 편집 대상
LibraryPanel.tsx # 보관함(이미지 재사용) + 저장된 세트(선택 인원의 레이어 구성 저장·불러오기)
utils/pendulum.ts # 수식 함수 (순수 함수, 테스트 대상)
utils/assetDb.ts # IndexedDB 래퍼 (보관함 이미지 / 저장된 세트 영구 저장)
utils/layerPresets.ts # 파일명으로 body/hair/tie/accessory 프리셋 추측
utils/layerElements.ts # 레이어 id → DOM 레지스트리 (rAF 루프용)
utils/frame.ts # 캐릭터 프레임(기준 폴더의 자른 영역) 계산
utils/groups.ts # 레이어 폴더: 자를 영역 계산, 폴더 순서 이동
utils/trim.ts # 이미지 불투명 영역(bbox) 측정
store/useLibraryStore.ts # 보관함·세트 (같은 이미지는 해시로 중복 방지)


## 6. 단계별 작업 순서 (이 순서대로 진행)
1. Vite + React + TS + Tailwind + Zustand 세팅, 빈 Stage/ControlPanel 배치
2. `pendulum.ts`에 감쇠 진자 함수 작성 + 간단한 테스트
3. 단일 이미지 업로드 → 리본에 매달려 흔들리기 (세기/속도/감쇠 슬라이더 연결)
4. 꿀렁임(skew/scale) 추가
5. 다중 레이어 업로드 + zIndex 정렬 + 레이어별 스프링 추종
6. 레이어 설정 UI (pivot 드래그 지정 포함)
7. 드래그로 밀기 인터랙션 (마우스/터치)
8. 반응형 레이아웃 마무리, 프리셋 저장(localStorage)
9. (선택) GIF/WebM 내보내기, PixiJS 메시 변형

## 7. 코딩 규칙
- 모든 애니메이션 값은 **React state가 아닌 ref**에 두고 rAF 루프에서 직접 DOM `style.transform` 갱신 (리렌더 최소화)
- 슬라이더 변경은 Zustand → 루프가 매 프레임 `getState()`로 읽음
- 이미지는 서버로 보내지 않음 (완전 클라이언트 사이드)
- 컴포넌트는 함수형 + 명시적 Props 타입
- 한국어 UI 라벨, 코드 주석은 한국어 OK
- 작업 전 이 문서를 읽고, 구조를 바꿀 때는 이 문서도 함께 업데이트

## 8. 완료 기준 (MVP)
- [ ] PNG 3장(body/hair/tie) 올리면 리본에 매달려 흔들리고, 머리카락과 넥타이가 본체보다 늦게 따라옴
- [ ] 세기/속도/감쇠/꿀렁임 4개 슬라이더가 즉시 반영됨
- [ ] 캐릭터를 드래그해서 놓으면 그 지점부터 다시 흔들림
- [ ] 모바일 세로 화면에서도 깨지지 않음