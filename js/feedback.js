// Ore Belt · feedback.js: 게임 안에서 GitHub 이슈 양식을 버전·기기·설정 정보와 함께 미리 채워 열기
"use strict";
// ---------- feedback ----------
function feedbackContext() {
  const ua = navigator.userAgent, last = loadReplays()[0];
  const lines = [
    `version: v${APP_VERSION}${BUILD ? ` (build ${BUILD.sha || "?"} ${BUILD.time || ""})` : ""}`,
    `device: ${ua}`,
    `screen: ${screen.width}x${screen.height} @${window.devicePixelRatio || 1}x, viewport ${innerWidth}x${innerHeight}, touch ${"ontouchstart" in window ? "yes" : "no"}`,
    `lang: ${LANG}, difficulty: ${["easy", "normal", "hard"][diffIdx]}, music: ${SET.music}, palette: ${SET.pal}, saver: ${SET.saver}, fps: ${SET.fps || "auto"}, instant: ${SET.instant}`,
    `progress: stars ${loadProg().stars.reduce((a, b) => a + (b || 0), 0)}, games ${STATS.games}, wins ${STATS.wins}`,
  ];
  if (S && !S.editor && !S.replay) lines.push(`current: ${S.m.name} (#${S.mi + 1}), wave ${S.wave}, t ${Math.round(S.t)}s, ore ${Math.floor(S.ore)}, buildings ${S.buildings.length}, lost ${S.lost}`);
  if (last) {
    lines.push(`last game: ${last.name}, ${last.res}, wave ${last.wave}, ${last.t}s`);
    const url = location.href.split("#")[0] + "#replay=" + replayCode(last);
    if (url.length < 3500) lines.push(`replay: ${url}`);
  }
  return lines.join("\n");
}
function openFeedback() {
  const mission = S && !S.editor ? `${S.mi >= 0 ? S.mi + 1 + ". " : ""}${S.m.name}` : "";
  const q = new URLSearchParams({ template: "feedback.yml", title: L("[피드백] ", "[Feedback] "), mission, context: feedbackContext() });
  window.open(`${REPO_URL}/issues/new?${q}`, "_blank", "noopener");
  toast(L("GitHub 이슈 양식을 열었습니다. GitHub 계정이 필요합니다.", "Opened the GitHub issue form. A GitHub account is required."), 4);
}
