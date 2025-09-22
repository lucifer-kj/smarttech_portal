import { createAdminClient } from '@/lib/supabase/client'
import { NotificationTriggerService } from './notification-trigger-service'

// Import the notification data type from push notification service
import type { NotificationData } from './push-notification-service'

export interface ScheduledNotification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  scheduledFor: Date
  data?: NotificationData
  templateId?: string
  templateVariables?: Record<string, string>
  sent: boolean
  createdAt: Date
}

export class ScheduledNotificationService {
  private static readonly TABLE_NAME = 'scheduled_notifications'

  /**
   * Schedule a notification for later delivery
   */
  static async scheduleNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    scheduledFor: Date,
    data?: NotificationData,
    templateId?: string,
    templateVariables?: Record<string, string>
  ): Promise<string> {
    const supabase = createAdminClient()

    const notificationData = {
      user_id: userId,
      notification_type: type,
      title,
      body,
      scheduled_for: scheduledFor.toISOString(),
      data: data || {},
      template_id: templateId || null,
      template_variables: templateVariables || {},
      sent: false,
      created_at: new Date().toISOString()
    }

    const { data: result, error } = await (supabase as any)
      .from(this.TABLE_NAME)
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to schedule notification: ${error.message}`)
    }

    return result.id
  }

  /**
   * Schedule maintenance reminder
   */
  static async scheduleMaintenanceReminder(
    userId: string,
    equipmentId: string,
    equipmentName: string,
    dueDate: Date,
    reminderDays: number = 7
  ): Promise<string> {
    const reminderDate = new Date(dueDate)
    reminderDate.setDate(reminderDate.getDate() - reminderDays)

    return this.scheduleNotification(
      userId,
      'maintenance_reminders',
      'Maintenance Due Soon',
      `Your ${equipmentName} maintenance is due on ${dueDate.toLocaleDateString()}`,
      reminderDate,
      {
        type: 'maintenance_reminder',
        equipmentId,
        dueDate: dueDate.toISOString()
      },
      'maintenance-reminder',
      {
        equipmentId,
        equipmentName,
        dueDate: dueDate.toLocaleDateString()
      }
    )
  }

  /**
   * Schedule appointment reminder
   */
  static async scheduleAppointmentReminder(
    userId: string,
    jobId: string,
    jobTitle: string,
    appointmentDate: Date,
    reminderHours: number = 24
  ): Promise<string> {
    const reminderDate = new Date(appointmentDate)
    reminderDate.setHours(reminderDate.getHours() - reminderHours)

    return this.scheduleNotification(
      userId,
      'job_updates',
      'Appointment Reminder',
      `You have an appointment for ${jobTitle} tomorrow at ${appointmentDate.toLocaleTimeString()}`,
      reminderDate,
      {
        type: 'appointment_reminder',
        jobId,
        appointmentDate: appointmentDate.toISOString()
      },
      'appointment-reminder',
      {
        jobTitle,
        jobId,
        appointmentDate: appointmentDate.toLocaleString()
      }
    )
  }

  /**
   * Schedule follow-up notification
   */
  static async scheduleFollowUpNotification(
    userId: string,
    jobId: string,
    jobTitle: string,
    followUpDays: number = 3
  ): Promise<string> {
    const followUpDate = new Date()
    followUpDate.setDate(followUpDate.getDate() + followUpDays)

    return this.scheduleNotification(
      userId,
      'feedback_responses',
      'How was your service?',
      `We hope you're satisfied with your ${jobTitle} service. Please let us know how we did!`,
      followUpDate,
      {
        type: 'follow_up',
        jobId
      },
      'follow-up',
      {
        jobTitle,
        jobId
      }
    )
  }

  /**
   * Process scheduled notifications (to be called by cron job)
   */
  static async processScheduledNotifications(): Promise<{
    processed: number
    sent: number
    failed: number
    errors: string[]
  }> {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    try {
      // Get notifications that are due
      const { data: notifications, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('sent', false)
        .lte('scheduled_for', now)
        .order('scheduled_for', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch scheduled notifications: ${error.message}`)
      }

      if (!notifications || notifications.length === 0) {
        return { processed: 0, sent: 0, failed: 0, errors: [] }
      }

      let sent = 0
      let failed = 0
      const errors: string[] = []

      for (const notification of (notifications as any[])) {
        try {
          // Send the notification
          const success = await NotificationTriggerService.sendNotification({
            userId: notification.user_id,
            type: notification.notification_type,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            templateId: notification.template_id,
            templateVariables: notification.template_variables
          })

          // Mark as sent
          await (supabase as any)
            .from(this.TABLE_NAME)
            .update({ sent: true, sent_at: new Date().toISOString() })
            .eq('id', notification.id)

          if (success) {
            sent++
          } else {
            failed++
            errors.push(`Failed to send notification ${notification.id}`)
          }
        } catch (error) {
          failed++
          errors.push(`Error processing notification ${notification.id}: ${error}`)
        }
      }

      return {
        processed: notifications.length,
        sent,
        failed,
        errors
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error)
      return {
        processed: 0,
        sent: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelScheduledNotification(notificationId: string): Promise<boolean> {
    const supabase = createAdminClient()

    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', notificationId)
        .eq('sent', false)

      if (error) {
        throw new Error(`Failed to cancel notification: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('Error canceling scheduled notification:', error)
      return false
    }
  }

  /**
   * Get user's scheduled notifications
   */
  static async getUserScheduledNotifications(userId: string): Promise<ScheduledNotification[]> {
    const supabase = createAdminClient()

    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .eq('sent', false)
        .order('scheduled_for', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch scheduled notifications: ${error.message}`)
      }

      return ((data || []) as any[]).map(notification => ({
        id: notification.id,
        userId: notification.user_id,
        type: notification.notification_type,
        title: notification.title,
        body: notification.body,
        scheduledFor: new Date(notification.scheduled_for),
        data: notification.data,
        templateId: notification.template_id,
        templateVariables: notification.template_variables,
        sent: notification.sent,
        createdAt: new Date(notification.created_at)
      }))
    } catch (error) {
      console.error('Error fetching user scheduled notifications:', error)
      return []
    }
  }

  /**
   * Clean up old sent notifications
   */
  static async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    const supabase = createAdminClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('sent', true)
        .lt('sent_at', cutoffDate.toISOString())
        .select('id')

      if (error) {
        throw new Error(`Failed to cleanup old notifications: ${error.message}`)
      }

      return data?.length || 0
    } catch (error) {
      console.error('Error cleaning up old notifications:', error)
      return 0
    }
  }
}
