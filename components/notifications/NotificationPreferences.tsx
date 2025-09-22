'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { 
  Bell, 
  BellOff, 
  Settings, 
  Clock, 
  Smartphone, 
  Monitor,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'

interface NotificationPreferences {
  job_updates: boolean
  quote_approvals: boolean
  technician_arrivals: boolean
  job_completions: boolean
  emergency_alerts: boolean
  system_alerts: boolean
  maintenance_reminders: boolean
  feedback_responses: boolean
  marketing: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  timezone: string
}

interface NotificationPreferencesProps {
  userId: string
}

export function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { success, error, info } = useToast()
  const { 
    permission, 
    isSupported, 
    isSubscribed, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications()

  const notificationTypes = [
    {
      key: 'job_updates' as keyof NotificationPreferences,
      label: 'Job Updates',
      description: 'Notifications when job status changes',
      icon: Settings,
      important: true
    },
    {
      key: 'quote_approvals' as keyof NotificationPreferences,
      label: 'Quote Approvals',
      description: 'Notifications for quotes requiring approval',
      icon: CheckCircle,
      important: true
    },
    {
      key: 'technician_arrivals' as keyof NotificationPreferences,
      label: 'Technician Arrivals',
      description: 'Notifications when technicians arrive',
      icon: Smartphone,
      important: true
    },
    {
      key: 'job_completions' as keyof NotificationPreferences,
      label: 'Job Completions',
      description: 'Notifications when jobs are completed',
      icon: CheckCircle,
      important: false
    },
    {
      key: 'emergency_alerts' as keyof NotificationPreferences,
      label: 'Emergency Alerts',
      description: 'Critical emergency notifications',
      icon: AlertTriangle,
      important: true
    },
    {
      key: 'system_alerts' as keyof NotificationPreferences,
      label: 'System Alerts',
      description: 'Important system notifications',
      icon: AlertTriangle,
      important: false
    },
    {
      key: 'maintenance_reminders' as keyof NotificationPreferences,
      label: 'Maintenance Reminders',
      description: 'Scheduled maintenance notifications',
      icon: Clock,
      important: false
    },
    {
      key: 'feedback_responses' as keyof NotificationPreferences,
      label: 'Feedback Responses',
      description: 'Responses to your feedback',
      icon: CheckCircle,
      important: false
    },
    {
      key: 'marketing' as keyof NotificationPreferences,
      label: 'Marketing',
      description: 'Promotional and marketing notifications',
      icon: Bell,
      important: false
    }
  ]

  useEffect(() => {
    loadPreferences()
  }, [userId])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/push/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      } else {
        // Create default preferences if none exist
        const createResponse = await fetch('/api/push/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
        
        if (createResponse.ok) {
          const data = await createResponse.json()
          setPreferences(data.preferences)
        }
      }
    } catch (err) {
      console.error('Error loading preferences:', err)
      error('Failed to load notification preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const savePreferences = async () => {
    if (!preferences) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/push/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      })

      if (response.ok) {
        success('Notification preferences saved successfully')
      } else {
        throw new Error('Failed to save preferences')
      }
    } catch (err) {
      console.error('Error saving preferences:', err)
      error('Failed to save notification preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const togglePreference = (key: keyof NotificationPreferences) => {
    if (!preferences) return

    setPreferences(prev => ({
      ...prev!,
      [key]: !prev![key]
    }))
  }

  const toggleQuietHours = () => {
    if (!preferences) return

    setPreferences(prev => ({
      ...prev!,
      quiet_hours_enabled: !prev!.quiet_hours_enabled
    }))
  }

  const updateQuietHours = (field: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    if (!preferences) return

    setPreferences(prev => ({
      ...prev!,
      [field]: value || null
    }))
  }

  const handleSubscribe = async () => {
    if (!isSupported) {
      error('Push notifications are not supported in this browser')
      return
    }

    if (!permission.granted) {
      const granted = await subscribe()
      if (granted) {
        success('Successfully subscribed to push notifications')
      } else {
        error('Failed to subscribe to push notifications')
      }
    } else {
      const unsubscribed = await unsubscribe()
      if (unsubscribed) {
        success('Successfully unsubscribed from push notifications')
      } else {
        error('Failed to unsubscribe from push notifications')
      }
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (!preferences) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          Failed to load notification preferences
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Push Notification Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Push Notifications</h3>
          <div className="flex items-center space-x-2">
            {isSubscribed ? (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Subscribed</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-500">
                <XCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Not Subscribed</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {isSupported 
                  ? 'Push notifications are supported in your browser'
                  : 'Push notifications are not supported in your browser'
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Permission: {permission.state}
              </p>
            </div>
            <Button
              onClick={handleSubscribe}
              disabled={!isSupported}
              className={isSubscribed ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {isSubscribed ? (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Unsubscribe
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Subscribe
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Notification Types */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Types</h3>
        <div className="space-y-4">
          {notificationTypes.map((type) => {
            const Icon = type.icon
            const isEnabled = preferences[type.key] as boolean

            return (
              <div key={type.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${isEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{type.label}</span>
                      {type.important && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                          Important
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => togglePreference(type.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Quiet Hours */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiet Hours</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Enable Quiet Hours</p>
              <p className="text-sm text-gray-600">
                Disable notifications during specified hours
              </p>
            </div>
            <button
              onClick={toggleQuietHours}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.quiet_hours_enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.quiet_hours_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {preferences.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={preferences.quiet_hours_start || ''}
                  onChange={(e) => updateQuietHours('quiet_hours_start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={preferences.quiet_hours_end || ''}
                  onChange={(e) => updateQuietHours('quiet_hours_end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={savePreferences}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  )
}
