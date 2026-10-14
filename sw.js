// 앱 화면을 캐시해 오프라인에서도 가상 실험실을 쓸 수 있게 한다. (AI 기능은 인터넷 필요)
const CACHE = 'chemlab-v1';
const SHELL = ['./', 'index.html', 'css/style.css', 'js/app.js', 'js/chemicals.js', 'js/reactions.js', 'js/ai.js', 'icon.svg', 'manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // 네트워크 우선, 실패하면 캐시
  e.respondWith(
    fetch(e.request)
      .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request)),
  );
});
