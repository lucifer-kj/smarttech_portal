import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'
import { pushNotificationService } from '@/services/push-notification-service'
import { PushSubscriptionService } from '@/services/push-subscription-service'

// POST /api/push/send - Send push notification
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get user from auth header (admin only)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      userId, 
      notificationType, 
      title, 
      body: notificationBody, 
      templateId, 
      templateVariables,
      data: notificationData 
    } = body

    if (!userId || !notificationType || !title || !notificationBody) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Initialize push notification service
    await pushNotificationService.initialize()

    // Get user's subscriptions
    const subscriptions = await PushSubscriptionService.getUserSubscriptions(userId)
    
    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'User has no active subscriptions' },
        { status: 404 }
      )
    }

    // Check if user should receive this notification type
    const shouldSend = await PushSubscriptionService.shouldSendNotification(
      userId, 
      notificationType as any
    )

    if (!shouldSend) {
      return NextResponse.json(
        { error: 'User has disabled this notification type' },
        { status: 403 }
      )
    }

    // Prepare notification payload
    const payload = {
      title,
      body: notificationBody,
      icon: '/icons/notification-icon.png',
      badge: '/icons/badge-icon.png',
      data: {
        ...notificationData,
        notificationType,
        userId,
        timestamp: Date.now()
      },
      requireInteraction: notificationType === 'quote_approval' || notificationType === 'emergency_response',
      tag: `${notificationType}-${userId}`
    }

    // Send notifications to all user subscriptions
    const results = []
    for (const subscriptionRecord of subscriptions) {
      const subscription = PushSubscriptionService.convertToPushSubscription(subscriptionRecord)
      
      try {
        const success = await pushNotificationService.sendNotification(subscription, payload)
        
        // Log notification in history
        const { data: notificationHistory } = await supabase.rpc('log_notification_delivery', {
          p_user_id: userId,
          p_subscription_id: subscriptionRecord.id,
          p_notification_type: notificationType,
          p_title: title,
          p_body: notificationBody,
          p_template_id: templateId || null,
          p_template_variables: templateVariables || {},
          p_status: success ? 'sent' : 'failed'
        })

        results.push({
          subscriptionId: subscriptionRecord.id,
          success,
          notificationId: notificationHistory
        })
      } catch (error) {
        console.error('Failed to send notification to subscription:', subscriptionRecord.id, error)
        results.push({
          subscriptionId: subscriptionRecord.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: successCount > 0,
      results: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        details: results
      }
    })
  } catch (error) {
    console.error('Error sending push notification:', error)
    return NextResponse.json(
      { error: 'Failed to send push notification' },
      { status: 500 }
    )
  }
}
