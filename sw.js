// Ore Belt service worker: offline play, stale-while-revalidate
const CACHE = "orebelt-1.3.1"; // keep in sync with APP_VERSION in js/config.js
const CORE = ["./", "./index.html", "./style.css", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./js/config.js", "./js/util.js", "./js/audio.js", "./js/daily.js", "./js/world.js", "./js/sim.js", "./js/render.js", "./js/ui.js", "./js/input.js", "./js/save.js", "./js/tutorial.js", "./js/codex.js", "./js/settings.js", "./js/achievements.js", "./js/editor.js", "./js/story.js", "./js/replay.js", "./js/main.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).pathname.endsWith("/build.json")) { // always try the network so the build time stays fresh
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
