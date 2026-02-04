const CACHE_NAME = 'echolisten-v2';
const RUNTIME_CACHE = 'echolisten-runtime-v2';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  // 图标文件会在运行时动态缓存
];

// API 缓存配置（不缓存 API 请求）
const API_PATTERNS = [
  /generativelanguage\.googleapis\.com/,
  /api\.deepgram\.com/,
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // 立即激活新的 Service Worker
      return self.skipWaiting();
    })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 立即控制所有客户端
      return self.clients.claim();
    })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 检查是否是 API 请求
  const isApiRequest = API_PATTERNS.some(pattern => pattern.test(url.href));

  if (isApiRequest) {
    // API 请求：直接走网络，不缓存
    event.respondWith(
      fetch(request).catch(error => {
        console.error('[SW] API request failed:', error);
        throw error;
      })
    );
    return;
  }

  // 静态资源：Cache First 策略
  if (request.destination === 'document' ||
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // 后台更新缓存
          fetch(request).then(response => {
            if (response.ok) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, response);
              });
            }
          });
          return cached;
        }

        return fetch(request).then(response => {
          // 只缓存成功的响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 缓存新资源
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });

          return response;
        }).catch(error => {
          console.error('[SW] Fetch failed:', error);
          throw error;
        });
      })
    );
    return;
  }

  // 其他请求：Network First 策略
  event.respondWith(
    fetch(request).then(response => {
      if (!response || response.status !== 200) {
        return response;
      }

      // 缓存响应
      const responseToCache = response.clone();
      caches.open(RUNTIME_CACHE).then(cache => {
        cache.put(request, responseToCache);
      });

      return response;
    }).catch(() => {
      // 网络失败，尝试从缓存读取
      return caches.match(request).then(cached => {
        if (cached) {
          return cached;
        }
        throw new Error('No cached data available');
      });
    })
  );
});

// 消息监听 - 用于手动清除缓存
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

