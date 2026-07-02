/* 今朝 — service worker */
const CACHE = "kesa-v4";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./favicon-64.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 別ドメイン（ニュース・天気・市況・画像・フォント等）はキャッシュせず常にネットワークへ
  if (url.origin !== self.location.origin) return;

  // ページ本体はネットワーク優先（最新の紙面を保つ）。オフライン時のみキャッシュへ
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return r;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // 同一ドメインの静的ファイル（アイコン等）はキャッシュ優先
  e.respondWith(caches.match(req).then((c) => c || fetch(req)));
});
