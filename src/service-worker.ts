/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare let self: ServiceWorkerGlobalScope;

// Create a unique cache name for this deployment
const CACHE = `plenura-cache-${version}`;

// Assets to cache immediately on install
const ASSETS = [
	...build, // the app itself
	...files  // everything in `static`
];

// Install event - cache all essential assets
self.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

// Fetch event - network first with cache fallback for pages
self.addEventListener('fetch', (event) => {
	// Ignore non-GET requests
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// For build files and static assets, serve from cache first
		if (ASSETS.includes(url.pathname)) {
			const cachedResponse = await cache.match(url.pathname);
			if (cachedResponse) {
				return cachedResponse;
			}
		}

		// For API calls, always go to network
		if (url.pathname.startsWith('/api/')) {
			try {
				return await fetch(event.request);
			} catch {
				return new Response(JSON.stringify({ error: 'offline' }), {
					status: 503,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		// For video session routes, require network (real-time critical)
		if (url.pathname.startsWith('/session/')) {
			try {
				return await fetch(event.request);
			} catch {
				// Return a friendly offline page for video sessions
				return new Response(
					'<html><body><h1>Sin conexion</h1><p>Las sesiones de video requieren conexion a internet.</p></body></html>',
					{
						status: 503,
						headers: { 'Content-Type': 'text/html' }
					}
				);
			}
		}

		// For navigation and page requests, try network first with cache fallback
		try {
			const response = await fetch(event.request);

			// Cache successful page responses
			if (response.status === 200) {
				const isPage = event.request.mode === 'navigate' ||
					event.request.headers.get('accept')?.includes('text/html');

				if (isPage) {
					cache.put(event.request, response.clone());
				}
			}

			return response;
		} catch {
			// Network failed, try cache
			const cachedResponse = await cache.match(event.request);
			if (cachedResponse) {
				return cachedResponse;
			}

			// If it's a navigation request, return cached home page
			if (event.request.mode === 'navigate') {
				const offlinePage = await cache.match('/');
				if (offlinePage) {
					return offlinePage;
				}
			}

			return new Response('Sin conexion', {
				status: 503,
				headers: { 'Content-Type': 'text/plain' }
			});
		}
	}

	event.respondWith(respond());
});

// Handle push notifications for appointment reminders
self.addEventListener('push', (event) => {
	if (!event.data) return;

	const data = event.data.json();

	const options: NotificationOptions = {
		body: data.body,
		icon: '/icons/icon-192x192.png',
		badge: '/icons/icon-72x72.png',
		vibrate: [100, 50, 100],
		tag: data.tag || 'appointment',
		data: {
			url: data.url || '/'
		}
	};

	event.waitUntil(
		self.registration.showNotification(data.title || 'Plenura', options)
	);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
	event.notification.close();

	const url = event.notification.data?.url || '/';

	event.waitUntil(
		self.clients.matchAll({ type: 'window' }).then((clients) => {
			for (const client of clients) {
				if (client.url === url && 'focus' in client) {
					return client.focus();
				}
			}
			if (self.clients.openWindow) {
				return self.clients.openWindow(url);
			}
		})
	);
});
