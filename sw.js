/* 柔道チーム管理アプリ — オフライン対応 Service Worker
   初回オンライン表示時にアプリ本体をキャッシュし、以後はオフラインでも開けます。 */
const CACHE = 'judo-app-cache-v1';

self.addEventListener('install', (e) => {
  // すぐ有効化
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // 古いキャッシュを掃除
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// GETリクエストはキャッシュ優先＋裏で更新（stale-while-revalidate）
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });

    const network = fetch(req).then((resp) => {
      // 正常応答のみ保存（同一オリジン）
      if (resp && resp.status === 200 && resp.type === 'basic') {
        cache.put(req, resp.clone()).catch(() => {});
      }
      return resp;
    }).catch(() => null);

    // キャッシュがあれば即返し、なければネットワーク、両方ダメなら最後にナビゲーションのキャッシュ
    if (cached) return cached;
    const net = await network;
    if (net) return net;
    // ページ遷移要求のオフライン時フォールバック
    if (req.mode === 'navigate') {
      const fallback = await cache.match('./') || await cache.match('index.html');
      if (fallback) return fallback;
    }
    return new Response('オフラインです', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
