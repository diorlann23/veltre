const VERSION = 'v2'
const STATIC_CACHE = `veltre-static-${VERSION}`
const PAGE_CACHE = `veltre-pages-${VERSION}`
const IMAGE_CACHE = `veltre-images-${VERSION}`
const OFFLINE_URL = '/offline'
const PRIVATE = ['/admin', '/account', '/checkout', '/login', '/register', '/cart']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, '/favicon.ico', '/icons/icon-192.png', '/icons/splash-mark.png', '/images/fallback.svg']))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('veltre-') && !k.endsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i])
}

async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request)
  if (hit) return hit
  const response = await fetch(request)
  if (response.ok) {
    cache.put(request, response.clone())
    if (max) trim(cacheName, max)
  }
  return response
}

async function networkFirstPage(request, cacheable) {
  try {
    const response = await fetch(request)
    if (cacheable && response.ok) {
      const cache = await caches.open(PAGE_CACHE)
      cache.put(request, response.clone())
      trim(PAGE_CACHE, 40)
    }
    return response
  } catch {
    const cached = cacheable ? await caches.match(request) : undefined
    return cached || (await caches.match(OFFLINE_URL)) || Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/api/images/')) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 300))
    return
  }
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/images/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }
  if (request.mode === 'navigate') {
    const cacheable = !PRIVATE.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))
    event.respondWith(networkFirstPage(request, cacheable))
  }
})
