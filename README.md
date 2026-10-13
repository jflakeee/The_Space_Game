# Ore Belt

소행성 채굴 + 타워 디펜스 웹게임. 플래시 게임 The Space Game의 규칙에서 영감을 받은 클린룸 구현으로,
원작의 코드, 그래픽, 사운드는 사용하지 않았습니다.

플레이: https://jflakeee.github.io/The_Space_Game/

## 배포
```bash
git clone https://github.com/jflakeee/The_Space_Game.git
cp index.html .nojekyll README.md The_Space_Game/
cd The_Space_Game && git add . && git commit -m "Ore Belt" && git push
```
GitHub → Settings → Pages → Source: `main` / `/ (root)`

## 구조
단일 `index.html` (Canvas 2D + 바닐라 JS, 의존성 없음). 로컬: `python -m http.server`

| 건물 | 비용 | 역할 |
|---|---|---|
| 중계기 | 15 | 전력망 확장 (사거리 150, 소행성이 연결 차단) |
| 태양광 | 30 | 에너지 +1.6/s |
| 채굴기 | 40 | 소행성 70 이내, 광석 2.2/s |
| 레이저 | 60 | 사거리 140, 22 dps, 에너지 소모 |
| 미사일 | 90 | 사거리 240, 범위 피해, 발사당 광석 2 |
| 수리소 | 70 | 범위 130 내 건물 수리 |

밸런스 수치는 `index.html` 상단 `DEF`, `EN`, `MISSIONS` 객체에서 조정.
