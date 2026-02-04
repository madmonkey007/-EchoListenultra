
// Service Worker disabled to prevent origin mismatch issues in sandboxed environments.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
