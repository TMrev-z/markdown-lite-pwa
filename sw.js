const CACHE_NAME = 'markdown-lite-pwa-v1.0.0';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// アプリシェルのリソース（常にキャッシュする）
const APP_SHELL = [
  '/markdown-lite-pwa/',
  '/markdown-lite-pwa/index.html',
  '/markdown-lite-pwa/styles.css',
  '/markdown-lite-pwa/app.js',
  '/markdown-lite-pwa/manifest.json',
  'https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js'
];

// インストール時: アプリシェルをキャッシュ
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('[SW] App shell cached');
        return self.skipWaiting();
      })
  );
});

// アクティベート時: 古いキャッシュを削除
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// フェッチ時: キャッシュファースト戦略
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // アプリシェルリソースの場合: キャッシュファースト
  if (APP_SHELL.includes(request.url) || request.url.includes('marked')) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          return response || fetch(request)
            .then(fetchResponse => {
              return caches.open(STATIC_CACHE)
                .then(cache => {
                  cache.put(request, fetchResponse.clone());
                  return fetchResponse;
                });
            });
        })
        .catch(() => {
          // オフライン時のフォールバック
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        })
    );
    return;
  }

  // その他のリソース: ネットワークファースト
  event.respondWith(
    fetch(request)
      .then(response => {
        // 成功レスポンスをキャッシュに保存
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // ネットワークエラー時はキャッシュから返す
        return caches.match(request);
      })
  );
});

// バックグラウンド同期（将来の機能拡張用）
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // ここで保存待ちファイルの同期処理を実装
      console.log('[SW] Performing background sync...')
    );
  }
});

// プッシュ通知（将来の機能拡張用）
self.addEventListener('push', event => {
  console.log('[SW] Push message received');
  // 将来的にファイル更新通知などを実装
});