import { createAdminClient } from '@/lib/supabase/client'
import { PushSubscription } from './push-notification-service'

// Define specific types for device information
export interface DeviceInfo {
  platform?: string
  browser?: string
  version?: string
  os?: string
  userAgent?: string
  [key: string]: string | number | boolean | undefined
}

export interface PushSubscriptionRecord {
  id: string
  user_id: string
  endpoint: string
  p256dh_key: string
  auth_key: string
  user_agent: string | null
  device_info: DeviceInfo | null
  enabled: boolean
  created_at: string
  updated_at: string
  last_used_at: string | null
}

export interface NotificationPreferences {
  user_id: string
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

export class PushSubscriptionService {
  private static readonly TABLE_NAME = 'push_subscriptions'
  private static readonly PREFERENCES_TABLE = 'notification_preferences'

  /**
   * Register a new push subscription for a user
   */
  static async registerSubscription(
    userId: string,
    subscription: PushSubscription,
    userAgent?: string,
    deviceInfo?: DeviceInfo
  ): Promise<PushSubscriptionRecord> {
    const supabase = createAdminClient()

    const subscriptionData = {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh_key: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      user_agent: userAgent || null,
      device_info: deviceInfo || null,
      enabled: true,
      last_used_at: new Date().toISOString()
    }

    const { data, error } = await (supabase as any)
      .from(this.TABLE_NAME)
      .insert(subscriptionData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to register push subscription: ${error.message}`)
    }

    return data
  }

  /**
   * Update an existing subscription
   */
  static async updateSubscription(
    subscriptionId: string,
    updates: Partial<Pick<PushSubscriptionRecord, 'enabled' | 'device_info' | 'last_used_at'>>
  ): Promise<void> {
    const supabase = createAdminClient()

    const { error } = await (supabase as any)
      .from(this.TABLE_NAME)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)

    if (error) {
      throw new Error(`Failed to update push subscription: ${error.message}`)
    }
  }

  /**
   * Get all subscriptions for a user
   */
  static async getUserSubscriptions(userId: string): Promise<PushSubscriptionRecord[]> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .eq('enabled', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch user subscriptions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get subscription by endpoint
   */
  static async getSubscriptionByEndpoint(endpoint: string): Promise<PushSubscriptionRecord | null> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('endpoint', endpoint)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Subscription not found
      }
      throw new Error(`Failed to fetch subscription: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a subscription
   */
  static async deleteSubscription(subscriptionId: string): Promise<void> {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('id', subscriptionId)

    if (error) {
      throw new Error(`Failed to delete push subscription: ${error.message}`)
    }
  }

  /**
   * Delete subscription by endpoint
   */
  static async deleteSubscriptionByEndpoint(endpoint: string): Promise<void> {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('endpoint', endpoint)

    if (error) {
      throw new Error(`Failed to delete push subscription: ${error.message}`)
    }
  }

  /**
   * Convert database record to PushSubscription format
   */
  static convertToPushSubscription(record: PushSubscriptionRecord): PushSubscription {
    return {
      endpoint: record.endpoint,
      keys: {
        p256dh: record.p256dh_key,
        auth: record.auth_key
      }
    }
  }

  /**
   * Get notification preferences for a user
   */
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    const supabase = createAdminClient()

    const { data, error } = await (supabase as any)
      .from(this.PREFERENCES_TABLE)
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Preferences not found
      }
      throw new Error(`Failed to fetch notification preferences: ${error.message}`)
    }

    return data
  }

  /**
   * Create default notification preferences for a user
   */
  static async createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
    const supabase = createAdminClient()

    const defaultPreferences: Omit<NotificationPreferences, 'user_id'> = {
      job_updates: true,
      quote_approvals: true,
      technician_arrivals: true,
      job_completions: true,
      emergency_alerts: true,
      system_alerts: true,
      maintenance_reminders: true,
      feedback_responses: true,
      marketing: false,
      quiet_hours_enabled: false,
      quiet_hours_start: null,
      quiet_hours_end: null,
      timezone: 'America/New_York'
    }

    const { data, error } = await (supabase as any)
      .from(this.PREFERENCES_TABLE)
      .insert({
        user_id: userId,
        ...defaultPreferences
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create notification preferences: ${error.message}`)
    }

    return data
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(
    userId: string,
    preferences: Partial<Omit<NotificationPreferences, 'user_id'>>
  ): Promise<NotificationPreferences> {
    const supabase = createAdminClient()

    const { data, error } = await (supabase as any)
      .from(this.PREFERENCES_TABLE)
      .update(preferences)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update notification preferences: ${error.message}`)
    }

    return data
  }

  /**
   * Check if user should receive notification based on preferences
   */
  static async shouldSendNotification(
    userId: string,
    notificationType: keyof Omit<NotificationPreferences, 'user_id' | 'quiet_hours_enabled' | 'quiet_hours_start' | 'quiet_hours_end' | 'timezone'>
  ): Promise<boolean> {
    const preferences = await this.getNotificationPreferences(userId)
    
    if (!preferences) {
      // If no preferences exist, use defaults
      const defaultPreferences = await this.createDefaultPreferences(userId)
      return defaultPreferences[notificationType]
    }

    // Check quiet hours
    if (preferences.quiet_hours_enabled && preferences.quiet_hours_start && preferences.quiet_hours_end) {
      const now = new Date()
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        timeZone: preferences.timezone 
      })
      
      if (currentTime >= preferences.quiet_hours_start && currentTime <= preferences.quiet_hours_end) {
        return false
      }
    }

    return preferences[notificationType]
  }

  /**
   * Get all active subscriptions for notifications
   */
  static async getActiveSubscriptions(): Promise<PushSubscriptionRecord[]> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('enabled', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch active subscriptions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Clean up expired subscriptions
   */
  static async cleanupExpiredSubscriptions(): Promise<number> {
    const supabase = createAdminClient()

    // Delete subscriptions that haven't been used in 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .lt('last_used_at', thirtyDaysAgo.toISOString())
      .select('id')

    if (error) {
      throw new Error(`Failed to cleanup expired subscriptions: ${error.message}`)
    }

    return data?.length || 0
  }

  /**
   * Get subscription statistics
   */
  static async getSubscriptionStats(): Promise<{
    total: number
    active: number
    inactive: number
    recent: number
  }> {
    const supabase = createAdminClient()

    const [totalResult, activeResult, inactiveResult, recentResult] = await Promise.all([
      supabase.from(this.TABLE_NAME).select('id', { count: 'exact' }),
      supabase.from(this.TABLE_NAME).select('id', { count: 'exact' }).eq('enabled', true),
      supabase.from(this.TABLE_NAME).select('id', { count: 'exact' }).eq('enabled', false),
      supabase.from(this.TABLE_NAME).select('id', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ])

    return {
      total: totalResult.count || 0,
      active: activeResult.count || 0,
      inactive: inactiveResult.count || 0,
      recent: recentResult.count || 0
    }
  }
}
