import { createAdminClient } from '@/lib/supabase/client'
import { pushNotificationService } from '@/services/push-notification-service'
import { PushSubscriptionService } from '@/services/push-subscription-service'

export interface NotificationTrigger {
  userId: string
  type: string
  title: string
  body: string
  data?: Record<string, any>
  templateId?: string
  templateVariables?: Record<string, string>
}

export class NotificationTriggerService {
  /**
   * Send job status change notification
   */
  static async sendJobStatusChangeNotification(
    jobId: string,
    jobTitle: string,
    oldStatus: string,
    newStatus: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if user should receive job update notifications
      const shouldSend = await PushSubscriptionService.shouldSendNotification(
        userId,
        'job_updates'
      )

      if (!shouldSend) {
        return false
      }

      const trigger: NotificationTrigger = {
        userId,
        type: 'job_updates',
        title: `Job Update: ${jobTitle}`,
        body: `Your job status has been updated from ${oldStatus} to ${newStatus}`,
        data: {
          type: 'job_update',
          jobId,
          oldStatus,
          newStatus
        },
        templateId: 'job-status-change',
        templateVariables: {
          jobTitle,
          jobId,
          status: newStatus
        }
      }

      return await this.sendNotification(trigger)
    } catch (error) {
      console.error('Error sending job status change notification:', error)
      return false
    }
  }

  /**
   * Send quote approval request notification
   */
  static async sendQuoteApprovalNotification(
    quoteId: string,
    jobTitle: string,
    amount: number,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if user should receive quote approval notifications
      const shouldSend = await PushSubscriptionService.shouldSendNotification(
        userId,
        'quote_approvals'
      )

      if (!shouldSend) {
        return false
      }

      const trigger: NotificationTrigger = {
        userId,
        type: 'quote_approvals',
        title: 'Quote Ready for Review',
        body: `You have a new quote for ${jobTitle} - $${amount.toLocaleString()}`,
        data: {
          type: 'quote_approval',
          quoteId,
          jobId: quoteId, // Assuming quoteId can be used to find jobId
          amount
        },
        templateId: 'quote-approval-request',
        templateVariables: {
          jobTitle,
          quoteId,
          amount: amount.toLocaleString()
        }
      }

      return await this.sendNotification(trigger)
    } catch (error) {
      console.error('Error sending quote approval notification:', error)
      return false
    }
  }

  /**
   * Send technician arrival notification
   */
  static async sendTechnicianArrivalNotification(
    jobId: string,
    jobTitle: string,
    technicianName: string,
    technicianId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if user should receive technician arrival notifications
      const shouldSend = await PushSubscriptionService.shouldSendNotification(
        userId,
        'technician_arrivals'
      )

      if (!shouldSend) {
        return false
      }

      const trigger: NotificationTrigger = {
        userId,
        type: 'technician_arrivals',
        title: 'Technician Arrived',
        body: `${technicianName} has arrived for your ${jobTitle} appointment`,
        data: {
          type: 'technician_arrival',
          jobId,
          technicianId,
          technicianName
        },
        templateId: 'technician-arrival',
        templateVariables: {
          jobTitle,
          jobId,
          technicianName,
          technicianId
        }
      }

      return await this.sendNotification(trigger)
    } catch (error) {
      console.error('Error sending technician arrival notification:', error)
      return false
    }
  }

  /**
   * Send job completion notification
   */
  static async sendJobCompletionNotification(
    jobId: string,
    jobTitle: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if user should receive job completion notifications
      const shouldSend = await PushSubscriptionService.shouldSendNotification(
        userId,
        'job_completions'
      )

      if (!shouldSend) {
        return false
      }

      const trigger: NotificationTrigger = {
        userId,
        type: 'job_completions',
        title: 'Job Completed Successfully',
        body: `Your ${jobTitle} has been completed. Please provide feedback.`,
        data: {
          type: 'job_completed',
          jobId
        },
        templateId: 'job-completed',
        templateVariables: {
          jobTitle,
          jobId
        }
      }

      return await this.sendNotification(trigger)
    } catch (error) {
      console.error('Error sending job completion notification:', error)
      return false
    }
  }

  /**
   * Send emergency response notification
   */
  static async sendEmergencyResponseNotification(
    emergencyId: string,
    technicianName: string,
    eta: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Emergency notifications should always be sent regardless of preferences
      // unless explicitly disabled
      const shouldSend = await PushSubscriptionService.shouldSendNotification(
        userId,
        'emergency_alerts'
      )

      if (!shouldSend) {
        return false
      }

      const trigger: NotificationTrigger = {
        userId,
        type: 'emergency_alerts',
        title: 'Emergency Service Dispatched',
        body: `Emergency technician ${technicianName} is on the way. ETA: ${eta}`,
        data: {
          type: 'emergency_response',
          emergencyId,
          technicianName,
          eta
        },
        templateId: 'emergency-response',
        templateVariables: {
          emergencyId,
          technicianName,
          eta
        }
      }

      return await this.sendNotification(trigger)
    } catch (error) {
      console.error('Error sending emergency response notification:', error)
      return false
    }
  }

  /**
   * Send system alert notification
   */
  static async sendSystemAlertNotification(
    alertId: string,
    alertType: string,
    alertMessage: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if user should receive system alert notifications
      const shouldSend = await PushSubscriptionService.shouldSendNotification(
        userId,
        'system_alerts'
      )

      if (!shouldSend) {
        return false
      }

      const trigger: NotificationTrigger = {
        userId,
        type: 'system_alerts',
        title: `System Alert: ${alertType}`,
        body: alertMessage,
        data: {
          type: 'system_alert',
          alertId,
          alertType
        },
        templateId: 'system-alert',
        templateVariables: {
          alertId,
          alertType,
          alertMessage
        }
      }

      return await this.sendNotification(trigger)
    } catch (error) {
      console.error('Error sending system alert notification:', error)
      return false
    }
  }

  /**
   * Send maintenance reminder notification
   */
  static async sendMaintenanceReminderNotification(
    equipmentId: string,
    equipmentName: string,
    dueDate: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if user should receive maintenance reminder notifications
      const shouldSend = await PushSubscriptionService.shouldSendNotification(
        userId,
        'maintenance_reminders'
      )

      if (!shouldSend) {
        return false
      }

      const trigger: NotificationTrigger = {
        userId,
        type: 'maintenance_reminders',
        title: 'Maintenance Due Soon',
        body: `Your ${equipmentName} maintenance is due on ${dueDate}`,
        data: {
          type: 'maintenance_reminder',
          equipmentId,
          dueDate
        },
        templateId: 'maintenance-reminder',
        templateVariables: {
          equipmentId,
          equipmentName,
          dueDate
        }
      }

      return await this.sendNotification(trigger)
    } catch (error) {
      console.error('Error sending maintenance reminder notification:', error)
      return false
    }
  }

  /**
   * Send feedback response notification
   */
  static async sendFeedbackResponseNotification(
    feedbackId: string,
    jobTitle: string,
    rating: number,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if user should receive feedback response notifications
      const shouldSend = await PushSubscriptionService.shouldSendNotification(
        userId,
        'feedback_responses'
      )

      if (!shouldSend) {
        return false
      }

      const trigger: NotificationTrigger = {
        userId,
        type: 'feedback_responses',
        title: 'Thank You for Your Feedback',
        body: `We appreciate your ${rating}-star rating for ${jobTitle}`,
        data: {
          type: 'feedback_response',
          feedbackId,
          rating
        },
        templateId: 'feedback-response',
        templateVariables: {
          feedbackId,
          jobTitle,
          rating: rating.toString()
        }
      }

      return await this.sendNotification(trigger)
    } catch (error) {
      console.error('Error sending feedback response notification:', error)
      return false
    }
  }

  /**
   * Send marketing notification
   */
  static async sendMarketingNotification(
    title: string,
    body: string,
    userId: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Check if user should receive marketing notifications
      const shouldSend = await PushSubscriptionService.shouldSendNotification(
        userId,
        'marketing'
      )

      if (!shouldSend) {
        return false
      }

      const trigger: NotificationTrigger = {
        userId,
        type: 'marketing',
        title,
        body,
        data: {
          type: 'marketing',
          ...data
        }
      }

      return await this.sendNotification(trigger)
    } catch (error) {
      console.error('Error sending marketing notification:', error)
      return false
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  static async sendBulkNotifications(
    triggers: NotificationTrigger[]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = await Promise.allSettled(
      triggers.map(trigger => this.sendNotification(trigger))
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
          errors.push(`Trigger ${index}: ${result.reason}`)
        }
      }
    })

    return { success, failed, errors }
  }

  /**
   * Core notification sending method
   */
  private static async sendNotification(trigger: NotificationTrigger): Promise<boolean> {
    try {
      // Initialize push notification service
      await pushNotificationService.initialize()

      // Get user's subscriptions
      const subscriptions = await PushSubscriptionService.getUserSubscriptions(trigger.userId)
      
      if (subscriptions.length === 0) {
        return false
      }

      // Prepare notification payload
      const payload = {
        title: trigger.title,
        body: trigger.body,
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge-icon.png',
        data: {
          ...trigger.data,
          notificationType: trigger.type,
          userId: trigger.userId,
          timestamp: Date.now()
        },
        requireInteraction: trigger.type === 'quote_approvals' || trigger.type === 'emergency_alerts',
        tag: `${trigger.type}-${trigger.userId}`
      }

      // Send to all user subscriptions
      let successCount = 0
      for (const subscriptionRecord of subscriptions) {
        const subscription = PushSubscriptionService.convertToPushSubscription(subscriptionRecord)
        
        try {
          const success = await pushNotificationService.sendNotification(subscription, payload)
          if (success) {
            successCount++
          }
        } catch (error) {
          console.error('Failed to send notification to subscription:', subscriptionRecord.id, error)
        }
      }

      return successCount > 0
    } catch (error) {
      console.error('Error in sendNotification:', error)
      return false
    }
  }
}
