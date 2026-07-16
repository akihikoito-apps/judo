/* My道場 Service Worker
   VERSION は index.html の APP_VERSION と必ず揃える。
   方針：HTMLはネットワーク優先／更新は「更新する」を押したときだけ（自動リロードしない）／
        有効化時に旧バージョンのキャッシュを全削除。 */
const VERSION = 'v147';
const CACHE = 'mydojo-' + VERSION;
const CORE = ['./', 'index.html', 'sw.js', 'terms.html', 'privacy.html'];

// インストール：主要ファイルを事前キャッシュ（skipWaitingはしない＝待機して更新バナーを出す）
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(CORE.map((u) => c.add(u))))
  );
});

// ユーザーが「更新する」を押したときだけ有効化
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// 有効化：このバージョン以外のキャッシュを全削除
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// 取得：HTML/ナビゲーションはネットワーク優先、その他はキャッシュ優先
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isHTML = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then((m) => m || caches.match('index.html')))
    );
  } else {
    e.respondWith(
      caches.match(req).then((m) => m || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => m))
    );
  }
});
