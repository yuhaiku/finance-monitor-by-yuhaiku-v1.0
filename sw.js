// 理财监控中心 Service Worker
const CACHE_NAME = 'finance-monitor-v1.0.0';

// 需要缓存的资源列表
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js',
  'https://p26-doubao-search-sign.byteimg.com/labis/131bb88b6ff9884b379617348f57c4f7~tplv-be4g95zd3a-image.jpeg?lk3s=feb11e32&x-expires=1788084314&x-signature=R8aK0Ij12gtQ3wuP92VySKMQs%2BQ%3D',
  'https://p3-doubao-search-sign.byteimg.com/labis/e65e9326441b6c0ad1a7f9bf2b4affb6~tplv-be4g95zd3a-image.jpeg?lk3s=feb11e32&x-expires=1788084314&x-signature=%2FKtrodeM7ObL1wg%2Fp9YbIFitOwU%3D',
  'https://p3-doubao-search-sign.byteimg.com/labis/3aab5e9ec2eb8ffa147512ff0183eedf~tplv-be4g95zd3a-image.jpeg?lk3s=feb11e32&x-expires=1788084314&x-signature=GbXHYoKcrZfM%2BQ0jIWR0AeNgOxg%3D'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: 缓存已打开');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: 删除旧缓存', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果在缓存中找到响应，则返回缓存的响应
        if (response) {
          return response;
        }
        
        // 否则发起网络请求
        return fetch(event.request)
          .then((response) => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应，因为响应是流，只能使用一次
            const responseToCache = response.clone();
            
            // 将新的响应添加到缓存中
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // 如果网络请求失败，尝试返回离线页面
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'refresh-finance-data') {
    event.waitUntil(refreshFinanceData());
  }
});

// 推送通知
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'https://p3-doubao-search-sign.byteimg.com/labis/3aab5e9ec2eb8ffa147512ff0183eedf~tplv-be4g95zd3a-image.jpeg?lk3s=feb11e32&x-expires=1788084314&x-signature=GbXHYoKcrZfM%2BQ0jIWR0AeNgOxg%3D',
    badge: 'https://p3-doubao-search-sign.byteimg.com/labis/3aab5e9ec2eb8ffa147512ff0183eedf~tplv-be4g95zd3a-image.jpeg?lk3s=feb11e32&x-expires=1788084314&x-signature=GbXHYoKcrZfM%2BQ0jIWR0AeNgOxg%3D',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // 如果已经有打开的窗口，则聚焦到该窗口
      for (const client of windowClients) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // 否则打开新窗口
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});

// 刷新理财数据的函数
async function refreshFinanceData() {
  // 这里可以添加从服务器获取最新数据的逻辑
  // 由于这是一个模拟应用，我们暂时不实现具体的数据刷新逻辑
  console.log('Service Worker: 刷新理财数据');
  return Promise.resolve();
}