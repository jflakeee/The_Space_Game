# Ore Belt

**v1.6.0** · [▶ 플레이](https://jflakeee.github.io/The_Space_Game/) · [변경 로그](CHANGELOG.md) · [릴리스](https://github.com/jflakeee/The_Space_Game/releases) · ![test](https://github.com/jflakeee/The_Space_Game/actions/workflows/test.yml/badge.svg)

소행성대 한가운데 기지를 세우는 타워 디펜스 웹게임입니다. 중계기로 전력망을 깔고, 소행성에서 광석을 캐고, 몰려오는 해적으로부터 코어를 지키세요. 소행성이 전력선을 가리기 때문에 배치 하나하나가 중요합니다.

2009년 플래시 게임 *The Space Game*(David Scott / The Casual Collective)의 규칙에서 영감을 받은 **클린룸 리메이크**입니다. 원작의 코드, 그래픽, 사운드는 사용하지 않았습니다.

---

## 플레이어용

### 무엇이 있나
| 구분 | 내용 |
|---|---|
| 임무 | 25개. 캠페인 1–10, 확장 11–20(격파·보스 목표, 레이저 금지 등 제약), 유리 군단 편 21–25. 스토리 브리핑 포함 |
| 모드 | 훈련(코어 무적, 웨이브 수동 호출) · 채굴 타임어택(광석 3000 최단 시간) · 생존(무한 벨트) · 일일 도전(날마다 같은 맵과 변형 규칙) |
| 건물 | 10종: 중계기, 태양광, 배터리, 채굴기, 레이저(Lv 2에서 속사/저격 분기), 미사일, 감속탑, 아크 코일, 미끼 신호기, 수리소 |
| 적 | 붉은 무리 9종(보스 모함·요새함) + 유리 군단 5종(보스 수확 모체) |
| 환경 위험 | 유성우, 이온 성운, 태양 플레어 |
| 기타 | 맵 에디터와 공유 링크, 리플레이(최근 5판, 1–8배속, 링크 공유), 업적 21종과 통계, 도감, 난이도 3단계 |

### 조작
- **마우스**: 건설 버튼 → 맵 클릭으로 설치, 드래그로 이동, 휠로 확대, 우클릭 드래그도 이동
- **터치**: 건설 버튼 → 위치 탭 → 점선 원을 끌어 조정 → ✓로 설치. 다른 곳을 끌면 화면 이동, 두 손가락으로 확대
- **키보드**: 숫자 1–9·0 건설, U 업그레이드(R/L 레이저 분기), Space 정지(정지 중에도 건설 가능), Esc 취소·메뉴, WASD/방향키 이동, +/- 확대
- 건물을 누르면 업그레이드(최대 Lv 3)·판매. 짓는 중인 건물과 중계기는 전액 환불, 나머지는 50%
- 별점은 잃은 건물 수 기준(3개 이하 ★3, 10개 이하 ★2, 쉬움은 최대 ★2)

### 소리와 음악
효과음과 배경음악은 모두 WebAudio로 실시간 합성합니다(음원 파일 없음). 배경음악은 **화면 확대에 반응**합니다. 축소하면 저음만, 기본 시점은 저음과 중음, 확대하면 멜로디까지 전체 합주로 들립니다. 설정에서 오케스트라 또는 앰비언트 스타일을 고를 수 있습니다. 브라우저 정책상 처음 한 번 화면을 눌러야 소리가 납니다.

### 설정
언어(한국어/English), 난이도, 소리(전체/효과음만/끔), 음악 스타일, 프레임 제한(60/30fps), 절전 모드, 색상 모드(기본/적록 색각 보정/고대비), 섬광 효과 줄이기, 화면 흔들림, UI 크기, 체력바 항상 표시, 임무 브리핑, 건설 방식(시간 소요/즉시), 진행 초기화

### 앱으로 설치 (오프라인 플레이)
- Android Chrome: 메뉴 → 앱 설치(홈 화면에 추가)
- iOS Safari: 공유 → 홈 화면에 추가
- PC Chrome/Edge: 주소창 오른쪽 설치 아이콘

진행 상황은 브라우저에 저장되며, 10초마다 자동 저장되어 메뉴에서 이어할 수 있습니다.

### 피드백
게임 메뉴나 일시정지 화면의 **"피드백 보내기"**를 눌러 주세요. GitHub 이슈 양식이 버전, 기기 정보, 마지막 판의 리플레이 링크와 함께 채워진 상태로 열립니다(GitHub 계정 필요). [이슈 양식 바로 가기](https://github.com/jflakeee/The_Space_Game/issues/new?template=feedback.yml)

---

## 개발자용

### 구조
빌드 도구와 외부 의존성이 없는 정적 사이트입니다(Canvas 2D + 바닐라 JS). 스크립트는 일반 `<script>`로 순서대로 로드되며, 뒤 파일이 앞 파일의 전역 선언을 사용합니다. 파일을 추가하면 `index.html`과 `sw.js`의 `CORE` 목록에 함께 넣으세요.

| 파일 | 내용 |
|---|---|
| `js/config.js` | 버전, 건물·적·임무 정의(DEF, EN, MISSIONS), 레벨별 수치(st) |
| `js/util.js` | 헬퍼, localStorage 래퍼, 다국어(L) |
| `js/audio.js` | 효과음, 확대 반응 배경음악(오케스트라·앰비언트), 파티클, 화면 흔들림, 오디오 잠금 해제 |
| `js/daily.js` | 일일 도전, 훈련·채굴 모드 정의 |
| `js/world.js` | 캔버스·카메라, 맵 생성, 게임 상태(newGame), 전력망·배치 판정 |
| `js/sim.js` | 전투, 환경 위험, 시뮬레이션 한 틱(update) |
| `js/render.js` | 월드 렌더링 |
| `js/ui.js` | HUD, 건설 바, 정보 패널, 메뉴, 결과 화면, 빌드 정보 |
| `js/input.js` | 마우스·터치·키보드 입력 |
| `js/save.js` | 자동 저장·이어하기, 일시정지 메뉴 |
| `js/tutorial.js` · `js/codex.js` · `js/story.js` | 튜토리얼, 도감, 브리핑 |
| `js/settings.js` · `js/achievements.js` | 설정, 업적·통계 |
| `js/editor.js` · `js/replay.js` · `js/feedback.js` | 맵 에디터(#map=), 리플레이(#replay=), 피드백 |
| `js/main.js` | 메인 루프(프레임 제한), 부팅, 테스트 훅 `window.__game` |
| `sw.js`, `manifest.webmanifest` | PWA |

### 결정적 시뮬레이션 (리플레이의 전제)
- 시뮬레이션은 **고정 틱 1/40초**와 판마다 정해진 **시드 난수**(`S.rng`)로 진행됩니다.
- 플레이어 행동(설치, 업그레이드, 판매, 웨이브 호출, 튜토리얼 진행)은 모두 `doAction()`을 거쳐 틱 번호와 함께 기록됩니다.
- **시뮬레이션 중 난수 소비 횟수를 바꾸는 변경**(예: 파티클 생성 수)은 리플레이를 깨뜨립니다. 화면 효과는 그리기 단계에서만 조절하세요. 수치가 바뀌면 마이너 버전을 올리세요(이전 버전 리플레이에는 경고가 표시됩니다).

### 로컬 실행과 테스트
```bash
python -m http.server              # http://localhost:8000
pip install playwright && playwright install chromium
python tests/smoke.py              # 스모크 테스트(한국어·영어), 버전·변경 로그 검사 포함
python tests/balance.py 3          # 밸런스 봇으로 임무별 승률 측정
python tests/smoke.py --url https://jflakeee.github.io/The_Space_Game/   # 배포본 대상
```

### CI와 배포 (`.github/workflows/`)
| 워크플로 | 하는 일 |
|---|---|
| `test.yml` | push·PR마다 JS 문법 검사와 스모크 테스트 |
| `pages.yml` | `main` push마다 GitHub Pages 배포, `build.json`(빌드 시각·커밋) 생성 → 메뉴 하단에 표시 |
| `release-zip.yml` | 릴리스 발행 시 `ore-belt-vX.Y.Z-web.zip`을 릴리스에 첨부(itch.io 업로드용: Kind = HTML, 1280×720, Mobile friendly) |

### 릴리스 절차
1. `js/config.js`의 `APP_VERSION`과 `sw.js`의 `CACHE`(`orebelt-X.Y.Z`)를 같이 올립니다.
2. `CHANGELOG.md` 맨 위에 `## [X.Y.Z] - 날짜` 항목과 하단 링크를 추가합니다(기존 제목줄은 지우지 않기). `js/ui.js`의 "새 소식" 문구도 갱신합니다.
3. `python tests/smoke.py` 통과 → push → `vX.Y.Z` 태그 → GitHub 릴리스 생성. zip은 자동으로 첨부됩니다.
