import webpush from 'web-push'

export interface VapidKeys {
  publicKey: string
  privateKey: string
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: Record<string, any>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  requireInteraction?: boolean
  silent?: boolean
  tag?: string
  timestamp?: number
  vibrate?: number[]
  url?: string
}

export interface NotificationTemplate {
  id: string
  name: string
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, any>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  requireInteraction?: boolean
  silent?: boolean
  tag?: string
}

export class PushNotificationService {
  private static instance: PushNotificationService
  private vapidKeys: VapidKeys | null = null
  private isInitialized = false

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService()
    }
    return PushNotificationService.instance
  }

  /**
   * Initialize the push notification service with VAPID keys
   */
  async initialize(vapidKeys?: VapidKeys): Promise<void> {
    if (this.isInitialized) return

    if (vapidKeys) {
      this.vapidKeys = vapidKeys
    } else {
      // Generate new VAPID keys if not provided
      this.vapidKeys = this.generateVapidKeys()
    }

    // Configure web-push with VAPID keys
    webpush.setVapidDetails(
      'mailto:support@smarttech.com',
      this.vapidKeys.publicKey,
      this.vapidKeys.privateKey
    )

    this.isInitialized = true
  }

  /**
   * Generate new VAPID keys
   */
  generateVapidKeys(): VapidKeys {
    const vapidKeys = webpush.generateVAPIDKeys()
    return {
      publicKey: vapidKeys.publicKey,
      privateKey: vapidKeys.privateKey
    }
  }

  /**
   * Get the public VAPID key for client-side subscription
   */
  getPublicKey(): string {
    if (!this.isInitialized || !this.vapidKeys) {
      throw new Error('Push notification service not initialized')
    }
    return this.vapidKeys.publicKey
  }

  /**
   * Send a push notification to a single subscription
   */
  async sendNotification(
    subscription: PushSubscription,
    payload: NotificationPayload
  ): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Push notification service not initialized')
    }

    try {
      const result = await webpush.sendNotification(subscription, JSON.stringify(payload))
      return result.statusCode === 201
    } catch (error) {
      console.error('Failed to send push notification:', error)
      return false
    }
  }

  /**
   * Send notifications to multiple subscriptions
   */
  async sendBulkNotifications(
    subscriptions: PushSubscription[],
    payload: NotificationPayload
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = await Promise.allSettled(
      subscriptions.map(subscription => this.sendNotification(subscription, payload))
    )

    let success = 0
    let failed = 0
    const errors: string[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        success++
      } else {
        failed++
        if (result.status === 'rejected') {
          errors.push(`Subscription ${index}: ${result.reason}`)
        }
      }
    })

    return { success, failed, errors }
  }

  /**
   * Send notification using a template
   */
  async sendTemplateNotification(
    subscription: PushSubscription,
    template: NotificationTemplate,
    variables?: Record<string, string>
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      title: this.interpolateTemplate(template.title, variables),
      body: this.interpolateTemplate(template.body, variables),
      icon: template.icon,
      badge: template.badge,
      data: template.data,
      actions: template.actions,
      requireInteraction: template.requireInteraction,
      silent: template.silent,
      tag: template.tag,
      timestamp: Date.now()
    }

    return this.sendNotification(subscription, payload)
  }

  /**
   * Interpolate template variables
   */
  private interpolateTemplate(template: string, variables?: Record<string, string>): string {
    if (!variables) return template

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match
    })
  }

  /**
   * Validate a push subscription
   */
  validateSubscription(subscription: PushSubscription): boolean {
    try {
      return !!(
        subscription.endpoint &&
        subscription.keys &&
        subscription.keys.p256dh &&
        subscription.keys.auth
      )
    } catch {
      return false
    }
  }

  /**
   * Get notification templates
   */
  getNotificationTemplates(): NotificationTemplate[] {
    return [
      {
        id: 'job-status-change',
        name: 'Job Status Change',
        title: 'Job Update: {{jobTitle}}',
        body: 'Your job status has been updated to {{status}}',
        icon: '/icons/job-icon.png',
        tag: 'job-{{jobId}}',
        requireInteraction: false,
        data: { type: 'job_update', jobId: '{{jobId}}' }
      },
      {
        id: 'quote-approval-request',
        name: 'Quote Approval Request',
        title: 'Quote Ready for Review',
        body: 'You have a new quote for {{jobTitle}} - ${{amount}}',
        icon: '/icons/quote-icon.png',
        tag: 'quote-{{quoteId}}',
        requireInteraction: true,
        actions: [
          { action: 'approve', title: 'Approve', icon: '/icons/check.png' },
          { action: 'reject', title: 'Reject', icon: '/icons/x.png' },
          { action: 'view', title: 'View Details', icon: '/icons/eye.png' }
        ],
        data: { type: 'quote_approval', quoteId: '{{quoteId}}', jobId: '{{jobId}}' }
      },
      {
        id: 'technician-arrival',
        name: 'Technician Arrival',
        title: 'Technician Arrived',
        body: '{{technicianName}} has arrived for your {{jobTitle}} appointment',
        icon: '/icons/technician-icon.png',
        tag: 'technician-{{jobId}}',
        requireInteraction: false,
        data: { type: 'technician_arrival', jobId: '{{jobId}}', technicianId: '{{technicianId}}' }
      },
      {
        id: 'job-completed',
        name: 'Job Completed',
        title: 'Job Completed Successfully',
        body: 'Your {{jobTitle}} has been completed. Please provide feedback.',
        icon: '/icons/success-icon.png',
        tag: 'job-completed-{{jobId}}',
        requireInteraction: true,
        actions: [
          { action: 'feedback', title: 'Leave Feedback', icon: '/icons/star.png' },
          { action: 'view', title: 'View Details', icon: '/icons/eye.png' }
        ],
        data: { type: 'job_completed', jobId: '{{jobId}}' }
      },
      {
        id: 'emergency-response',
        name: 'Emergency Response',
        title: 'Emergency Service Dispatched',
        body: 'Emergency technician {{technicianName}} is on the way. ETA: {{eta}}',
        icon: '/icons/emergency-icon.png',
        tag: 'emergency-{{emergencyId}}',
        requireInteraction: true,
        actions: [
          { action: 'track', title: 'Track Technician', icon: '/icons/location.png' },
          { action: 'call', title: 'Call Support', icon: '/icons/phone.png' }
        ],
        data: { type: 'emergency_response', emergencyId: '{{emergencyId}}' }
      },
      {
        id: 'system-alert',
        name: 'System Alert',
        title: 'System Alert: {{alertType}}',
        body: '{{alertMessage}}',
        icon: '/icons/alert-icon.png',
        tag: 'system-{{alertId}}',
        requireInteraction: true,
        data: { type: 'system_alert', alertId: '{{alertId}}', alertType: '{{alertType}}' }
      },
      {
        id: 'maintenance-reminder',
        name: 'Maintenance Reminder',
        title: 'Maintenance Due Soon',
        body: 'Your {{equipmentName}} maintenance is due on {{dueDate}}',
        icon: '/icons/maintenance-icon.png',
        tag: 'maintenance-{{equipmentId}}',
        requireInteraction: false,
        data: { type: 'maintenance_reminder', equipmentId: '{{equipmentId}}' }
      },
      {
        id: 'feedback-response',
        name: 'Feedback Response',
        title: 'Thank You for Your Feedback',
        body: 'We appreciate your {{rating}}-star rating for {{jobTitle}}',
        icon: '/icons/feedback-icon.png',
        tag: 'feedback-{{feedbackId}}',
        requireInteraction: false,
        data: { type: 'feedback_response', feedbackId: '{{feedbackId}}', jobId: '{{jobId}}' }
      }
    ]
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): NotificationTemplate | undefined {
    return this.getNotificationTemplates().find(template => template.id === templateId)
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance()
