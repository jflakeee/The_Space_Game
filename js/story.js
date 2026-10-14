// Ore Belt · story.js: 임무 브리핑과 스토리
"use strict";
// ---------- briefings & story ----------
// [speaker, ko, en, intercept_ko, intercept_en, win_ko, win_en]
const STORY = [
  ["sera", "새 계약자님, 환영합니다. 이 구역의 첫 광맥을 확보해 주세요. 광석 300이면 조합이 정식 기지로 인정합니다.", "Welcome, new contractor. Secure the first vein in this sector. 300 ore and the Guild will register you as a base.", "", "", "기지 등록 완료. 이제 진짜 일이 시작됩니다.", "Base registered. Now the real work begins."],
  ["sera", "이 구역은 소행성이 멀리 흩어져 있어요. 배터리를 보내드렸으니 남는 전력을 모아 두세요.", "Asteroids are scattered far apart here. We sent you batteries, so bank your spare power.", "", "", "전력망 안정. 그런데 근처에서 미확인 신호가 잡혔어요.", "Grid stable. But we're picking up an unknown signal nearby."],
  ["sera", "그 신호, '붉은 무리' 해적이었어요. 수리소를 지원합니다. 여섯 번의 공격만 버텨 주세요.", "That signal was the Red Swarm, a pirate band. We're sending repair bays. Hold out through six raids.", "", "", "버텨냈군요! 놈들이 더 큰 걸 준비하는 것 같아요.", "You held! They seem to be preparing something bigger."],
  ["sera", "조합 연구소가 미사일 포대와 미끼 신호기를 보냈어요. 실전 데이터를 부탁해요.", "The Guild lab sent missile batteries and decoy beacons. We need field data.", "", "", "데이터 훌륭해요. 연구소가 기뻐하네요.", "Great data. The lab is thrilled."],
  ["sera", "고순도 광맥이 발견됐어요. 해적들도 알고 있으니 습격이 잦을 거예요. 빠르게 캐세요.", "A high-grade vein was found. The pirates know too, so expect frequent raids. Mine fast.", "저 광맥은 우리 거다. 계속 들이쳐.", "That vein is ours. Keep hitting them.", "광맥 확보! 해적 통신량이 늘고 있어요.", "Vein secured! Pirate chatter is rising."],
  ["sera", "이번 구역은 소행성이 거의 없어요. 한 덩어리도 아껴 쓰세요.", "Almost no asteroids in this sector. Make every rock count.", "", "", "알뜰하네요. 다음 구역은 시끄러울 거예요.", "Thrifty. The next sector will be loud."],
  ["sera", "해적이 자폭선을 투입했어요. 감속탑과 아크 코일을 해금했어요. 접근하기 전에 막아야 해요.", "The pirates are sending bombers. Slow fields and arc coils are unlocked. Stop them before they reach you.", "폭탄을 실어라. 놈들 기지에 처박아.", "Load the charges. Ram their base.", "자폭 전술은 무력화됐어요. 그런데 실드함이 목격됐어요.", "Bomber tactics neutralized. But shield ships have been spotted."],
  ["sera", "실드함이 주변 함선을 보호해요. 실드함 자체는 무방비니 먼저 노리세요.", "Shield ships protect their escorts but not themselves. Target them first.", "", "", "함대 격퇴. 고립된 전초기지에서 구조 요청이 왔어요.", "Fleet repelled. An isolated outpost is calling for help."],
  ["sera", "보급이 끊긴 기지예요. 자금이 거의 없으니 채굴부터 차근차근 하세요.", "This outpost is cut off from supply. Funds are thin, so start with mining.", "", "", "기지 재건 성공. 붉은 무리의 본대가 움직입니다.", "Outpost rebuilt. The Red Swarm's main fleet is on the move."],
  ["sera", "본대가 옵니다. 열다섯 번의 공격을 막으면 이 벨트는 우리 거예요.", "Their main fleet is coming. Stop fifteen raids and this belt is ours.", "전 함대 출격. 벨트를 되찾는다.", "All ships, launch. We take the belt back.", "해냈어요! ...그런데 벨트 바깥에서 더 큰 신호가 잡혔어요.", "You did it! ...But there's a bigger signal beyond the belt."],
  ["sera", "감청 내용 들었죠? 보급선을 끊으면 요새함을 못 띄워요. 120척을 격파하세요.", "Did you hear that? Cut their supply and they can't launch the dreadnought. Destroy 120 ships.", "보급선이 끊기면 요새함은 못 뜬다. 호위 철저히.", "Lose the supply line and the dreadnought stays grounded. Escort them.", "보급선 차단 성공. 요새함 출격이 늦춰졌어요.", "Supply line cut. The dreadnought is delayed."],
  ["sera", "태양 폭풍으로 레이저 렌즈가 전부 망가졌어요. 미사일과 아크 코일로 버텨야 해요.", "A solar storm cracked every laser lens. Hold with missiles and arc coils.", "", "", "레이저 없이도 버티다니, 대단해요.", "Holding without lasers. Impressive."],
  ["sera", "이온 성운 속 광맥이에요. 성운 안에선 태양광이 약하지만, 적도 느려져요.", "This vein sits in an ion nebula. Solar is weak inside, but enemies slow down too.", "", "", "성운 광맥 확보. 요새함 좌표가 잡혔어요.", "Nebula vein secured. We've located the dreadnought."],
  ["sera", "요새함이 6번째 공격과 함께 나타나요. 격파하면 임무 완료예요. 미끼로 포격을 흩트리세요.", "The dreadnought arrives with the sixth raid. Destroy it to win. Use decoys to scatter its shelling.", "요새함 출격. 저 광산을 지도에서 지워라.", "Dreadnought launching. Wipe that mine off the map.", "요새함 격침! 붉은 무리가 동요하고 있어요.", "Dreadnought down! The Red Swarm is shaken."],
  ["sera", "붉은 무리가 엔진을 개조했어요. 태양 플레어가 잦은 구역이니 에너지가 넘칠 때를 노리세요.", "The Red Swarm upgraded their engines. Flares are frequent here, so strike when energy surges.", "", "", "빠른 놈들도 결국 멈추는군요.", "Even the fast ones stop eventually."],
  ["sera", "유성우 지대예요. 소행성도 적고... 피해 복구 준비를 단단히 하세요.", "This is a meteor zone, and asteroids are scarce. Be ready to repair.", "", "", "유성우 속에서도 채굴 완료. 베테랑이네요.", "Mining done under a meteor storm. You're a veteran."],
  ["sera", "놈들이 총공세를 시작했어요. 300척이 쉬지 않고 몰려올 거예요.", "They've launched an all-out assault. 300 ships, without pause.", "멈추지 마라. 놈들이 지칠 때까지 밀어붙여.", "Don't stop. Push until they break.", "총공세 격퇴! 남은 건 정예 함대뿐이에요.", "Assault broken! Only their elite fleet remains."],
  ["sera", "장갑을 두른 정예 함대예요. 저격 레이저와 미사일이 필요할 거예요.", "Their elite fleet is heavily armored. You'll need Lance lasers and missiles.", "", "", "장갑 함대 격파. 마지막 요새함 두 척이 남았어요.", "Armored fleet defeated. Two final dreadnoughts remain."],
  ["sera", "요새함 두 척이 동시에 와요. 미끼로 포격을 분산하고 하나씩 무너뜨리세요.", "Two dreadnoughts are coming together. Split their fire with decoys and take them down one by one.", "쌍둥이 요새, 동시 포격 준비.", "Twin fortresses, prepare a combined barrage.", "두 척 모두 격침! 붉은 무리의 마지막 저항만 남았어요.", "Both destroyed! Only the Red Swarm's last stand remains."],
  ["sera", "마지막이에요. 스무 번을 버티면 붉은 무리는 이 벨트를 포기할 거예요.", "This is it. Survive twenty raids and the Red Swarm abandons the belt for good.", "전부 쏟아부어라. 이번이 마지막이다.", "Throw everything. This is the last chance.", "벨트에 평화가 왔어요. 고마워요, 계약자님.", "Peace returns to the belt. Thank you, contractor."],
];
function startMission(i) { if (SET.brief && MISSIONS[i] && MISSIONS[i].goal && STORY[i]) showBriefing(i); else newGame(i); }
function showBriefing(i) {
  const m = MISSIONS[i], st = STORY[i], o = $("overlay");
  if (S) S.paused = true;
  $("hud").hidden = true; $("bar").hidden = true; $("info").hidden = true;
  o.innerHTML = `<div class="card brief"><small class="mno">${L("임무", "Mission")} ${i + 1}${i >= 10 ? " · " + L("확장", "Expansion") : ""}</small>
    <h1 style="font-size:34px">${m.name}</h1>
    <div class="goalbox">${m.desc}</div>
    <div class="msg"><i class="av">S</i><div><b>${L("관제관 세라", "Controller Sera")}</b><p>${L(st[1], st[2])}</p></div></div>
    ${st[3] ? `<div class="msg ix"><i class="av">!</i><div><b>${L("감청된 해적 통신", "Intercepted pirate comms")}</b><p>${L(st[3], st[4])}</p></div></div>` : ""}
    <button class="ms" id="brGo"><b>${L("출격", "Launch")}</b></button><button class="ms" id="brBack"><b>${L("뒤로", "Back")}</b></button></div>`;
  o.hidden = false; o.scrollTop = 0;
  $("brGo").onclick = () => newGame(i);
  $("brBack").onclick = showMenu;
}
