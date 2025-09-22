// Service Worker for Push Notifications and Offline Caching
const CACHE_NAME = 'smarttech-portal-v1'
const NOTIFICATION_ICON = '/icons/notification-icon.png'
const OFFLINE_CACHE_NAME = 'smarttech-portal-offline-v1'

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
]

// API routes to cache for offline viewing
const API_CACHE_ROUTES = [
  '/api/client/jobs',
  '/api/client/quotes',
  '/api/client/documents'
]

// Install event
self.addEventListener('install', (event) => {
  console.log('Service worker installing...')
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(STATIC_ASSETS)
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service worker activating...')
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  )
})

// Fetch event - handle offline caching and background sync
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle API requests with cache-first strategy
  if (API_CACHE_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(
      caches.open(OFFLINE_CACHE_NAME).then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            // Return cached response and update cache in background
            fetch(request).then(fetchResponse => {
              if (fetchResponse.ok) {
                cache.put(request, fetchResponse.clone())
              }
            }).catch(() => {
              // Network error, keep using cached response
            })
            return response
          }
          
          // No cached response, try network
          return fetch(request).then(fetchResponse => {
            if (fetchResponse.ok) {
              cache.put(request, fetchResponse.clone())
            }
            return fetchResponse
          }).catch(() => {
            // Network failed, return offline page
            return caches.match('/offline.html')
          })
        })
      })
    )
    return
  }

  // Handle static assets with cache-first strategy
  if (request.method === 'GET' && !url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          return response
        }
        
        return fetch(request).then(fetchResponse => {
          if (fetchResponse.ok) {
            const responseClone = fetchResponse.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone)
            })
          }
          return fetchResponse
        }).catch(() => {
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline.html')
          }
        })
      })
    )
  }
})

// Background sync for feedback submission
self.addEventListener('sync', (event) => {
  if (event.tag === 'feedback-sync') {
    event.waitUntil(
      // Get pending feedback from IndexedDB
      getPendingFeedback().then(feedbackData => {
        if (feedbackData && feedbackData.length > 0) {
          return Promise.all(
            feedbackData.map(feedback => 
              fetch('/api/client/feedback', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedback)
              }).then(response => {
                if (response.ok) {
                  // Remove from pending queue
                  removePendingFeedback(feedback.id)
                }
                return response
              })
            )
          )
        }
      })
    )
  }
})

// Helper functions for background sync
async function getPendingFeedback() {
  // This would integrate with IndexedDB to get pending feedback
  // For now, return empty array
  return []
}

async function removePendingFeedback(id) {
  // This would remove feedback from IndexedDB
  console.log('Removing pending feedback:', id)
}

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event)

  if (!event.data) {
    console.log('Push event has no data')
    return
  }

  try {
    const data = event.data.json()
    console.log('Push data:', data)

    const options = {
      body: data.body,
      icon: data.icon || NOTIFICATION_ICON,
      badge: data.badge || '/icons/badge-icon.png',
      image: data.image,
      data: data.data || {},
      tag: data.tag,
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      vibrate: data.vibrate || [200, 100, 200],
      actions: data.actions || [],
      timestamp: data.timestamp || Date.now()
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  } catch (error) {
    console.error('Error handling push event:', error)
    
    // Show fallback notification
    event.waitUntil(
      self.registration.showNotification('SmartTech Portal', {
        body: 'You have a new notification',
        icon: NOTIFICATION_ICON,
        badge: '/icons/badge-icon.png',
        tag: 'fallback',
        data: { type: 'fallback' }
      })
    )
  }
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)

  event.notification.close()

  const data = event.notification.data || {}
  let url = '/client'

  // Determine URL based on notification type
  switch (data.type) {
    case 'job_update':
      url = `/client/jobs/${data.jobId}`
      break
    case 'quote_approval':
      url = `/client/quotes/${data.quoteId}`
      break
    case 'technician_arrival':
      url = `/client/jobs/${data.jobId}`
      break
    case 'job_completed':
      url = `/client/jobs/${data.jobId}`
      break
    case 'emergency_response':
      url = '/client/emergency'
      break
    case 'system_alert':
      url = '/admin/alerts'
      break
    case 'maintenance_reminder':
      url = '/client/maintenance'
      break
    case 'feedback_response':
      url = '/client/feedback'
      break
    default:
      url = '/client'
  }

  // Handle action buttons
  if (event.action) {
    switch (event.action) {
      case 'approve':
        url = `/client/quotes/${data.quoteId}?action=approve`
        break
      case 'reject':
        url = `/client/quotes/${data.quoteId}?action=reject`
        break
      case 'view':
        url = data.jobId ? `/client/jobs/${data.jobId}` : '/client'
        break
      case 'feedback':
        url = `/client/feedback?jobId=${data.jobId}`
        break
      case 'track':
        url = `/client/jobs/${data.jobId}?tab=tracking`
        break
      case 'call':
        url = 'tel:+1555911HELP'
        break
    }
  }

  // Open or focus the window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )

  // Log notification click
  if (data.notificationId) {
    fetch('/api/push/notification-clicked', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationId: data.notificationId
      })
    }).catch(console.error)
  }
})

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event)

  const data = event.notification.data
  if (data?.notificationId) {
    fetch('/api/push/notification-dismissed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notificationId: data.notificationId
      })
    }).catch(console.error)
  }
})

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag)

  if (event.tag === 'notification-sync') {
    event.waitUntil(
      syncNotifications()
    )
  }
})

// Sync notifications when back online
async function syncNotifications() {
  try {
    // Get any pending notifications from IndexedDB
    const pendingNotifications = await getPendingNotifications()
    
    for (const notification of pendingNotifications) {
      try {
        await fetch('/api/push/sync-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notification)
        })
        
        // Remove from pending list
        await removePendingNotification(notification.id)
      } catch (error) {
        console.error('Failed to sync notification:', error)
      }
    }
  } catch (error) {
    console.error('Error syncing notifications:', error)
  }
}

// IndexedDB utilities for offline storage
const DB_NAME = 'SmartTechPortalDB'
const DB_VERSION = 1
const STORE_NAME = 'pendingNotifications'

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

async function getPendingNotifications() {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error getting pending notifications:', error)
    return []
  }
}

async function removePendingNotification(id) {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    store.delete(id)
  } catch (error) {
    console.error('Error removing pending notification:', error)
  }
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service worker error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service worker unhandled rejection:', event.reason)
})
