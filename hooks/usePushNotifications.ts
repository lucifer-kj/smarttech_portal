'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface NotificationPermissionInfo {
  state: NotificationPermission
  granted: boolean
  denied: boolean
  default: boolean
}

export interface PushNotificationHook {
  // Permission state
  permission: NotificationPermissionInfo
  isSupported: boolean
  
  // Subscription state
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  requestPermission: () => Promise<boolean>
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  updateSubscription: () => Promise<void>
  
  // Notification handling
  handleNotificationClick: (notification: Notification) => void
  handleNotificationClose: (notification: Notification) => void
}

export function usePushNotifications(): PushNotificationHook {
  const { user } = useAuth()
  const [permission, setPermission] = useState<NotificationPermissionInfo>({
    state: 'default',
    granted: false,
    denied: false,
    default: true
  })
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  // (moved below after function declarations)

  // Update permission state
  const updatePermissionState = useCallback(() => {
    if (!isSupported) return

    const state = Notification.permission
    setPermission({
      state,
      granted: state === 'granted',
      denied: state === 'denied',
      default: state === 'default'
    })
  }, [isSupported])

  // Check if user is subscribed
  const checkSubscriptionStatus = useCallback(async () => {
    if (!isSupported || !user) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (err) {
      console.error('Error checking subscription status:', err)
      setError('Failed to check subscription status')
    }
  }, [isSupported, user])

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)
    
    if (supported) {
      updatePermissionState()
      checkSubscriptionStatus()
    }
  }, [checkSubscriptionStatus, updatePermissionState])

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      updatePermissionState()
      return result === 'granted'
    } catch (err) {
      console.error('Error requesting permission:', err)
      setError('Failed to request notification permission')
      return false
    }
  }, [isSupported, updatePermissionState])

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) {
      setError('Push notifications not supported or user not authenticated')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Request permission if not granted
      if (!permission.granted) {
        const granted = await requestPermission()
        if (!granted) {
          setIsLoading(false)
          return false
        }
      }

      // Get VAPID public key
      const response = await fetch('/api/push/vapid-public-key')
      if (!response.ok) {
        throw new Error('Failed to get VAPID public key')
      }
      
      const { publicKey } = await response.json()
      
      // Convert VAPID key to Uint8Array
      const applicationServerKey: Uint8Array = urlBase64ToUint8Array(publicKey)
      
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      
      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      })
      
      // Send subscription to server
      const subscribeResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          deviceInfo: {
            platform: navigator.platform,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
      })
      
      if (!subscribeResponse.ok) {
        throw new Error('Failed to register subscription with server')
      }
      
      setIsSubscribed(true)
      setIsLoading(false)
      return true
      
    } catch (err) {
      console.error('Error subscribing to push notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to subscribe to push notifications')
      setIsLoading(false)
      return false
    }
  }, [isSupported, user, permission.granted, requestPermission])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe()
        
        // Remove subscription from server
        const unsubscribeResponse = await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        })
        
        if (!unsubscribeResponse.ok) {
          throw new Error('Failed to remove subscription from server')
        }
      }
      
      setIsSubscribed(false)
      setIsLoading(false)
      return true
      
    } catch (err) {
      console.error('Error unsubscribing from push notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe from push notifications')
      setIsLoading(false)
      return false
    }
  }, [isSupported])

  // Update subscription
  const updateSubscription = useCallback(async (): Promise<void> => {
    if (!isSupported || !user) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        // Update last used timestamp
        await fetch('/api/push/update-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            lastUsedAt: new Date().toISOString()
          })
        })
      }
    } catch (err) {
      console.error('Error updating subscription:', err)
    }
  }, [isSupported, user])

  // Handle notification click
  const handleNotificationClick = useCallback((notification: Notification) => {
    // Close the notification
    notification.close()
    
    // Handle different notification types
    const data = notification.data
    if (data) {
      switch (data.type) {
        case 'job_update':
          window.location.href = `/client/jobs/${data.jobId}`
          break
        case 'quote_approval':
          window.location.href = `/client/quotes/${data.quoteId}`
          break
        case 'technician_arrival':
          window.location.href = `/client/jobs/${data.jobId}`
          break
        case 'job_completed':
          window.location.href = `/client/jobs/${data.jobId}`
          break
        case 'emergency_response':
          window.location.href = `/client/emergency`
          break
        case 'system_alert':
          window.location.href = `/admin/alerts`
          break
        case 'maintenance_reminder':
          window.location.href = `/client/maintenance`
          break
        case 'feedback_response':
          window.location.href = `/client/feedback`
          break
        default:
          window.location.href = '/client'
      }
    } else {
      // Default to client dashboard
      window.location.href = '/client'
    }
    
    // Log notification click
    if (data?.notificationId) {
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
  }, [])

  // Handle notification close
  const handleNotificationClose = useCallback((notification: Notification) => {
    const data = notification.data
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
  }, [])

  // Set up notification event listeners
  useEffect(() => {
    if (!isSupported) return

    const handleNotificationClickEvent = (event: Event) => {
      const notification = event.target as Notification
      handleNotificationClick(notification)
    }

    const handleNotificationCloseEvent = (event: Event) => { // TODO: Implement notification close handling
      const notification = event.target as Notification
      handleNotificationClose(notification)
    }

    // Listen for notification events
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        handleNotificationClickEvent(event.data.notification)
      }
    })

    return () => {
      // Cleanup event listeners if needed
    }
  }, [isSupported, handleNotificationClick, handleNotificationClose])

  return {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    updateSubscription,
    handleNotificationClick,
    handleNotificationClose
  }
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Service Worker registration utility
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service worker registered successfully:', registration)
    return registration
  } catch (error) {
    console.error('Service worker registration failed:', error)
    return null
  }
}
