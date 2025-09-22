import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'
import { PushSubscriptionService } from '@/services/push-subscription-service'

// POST /api/push/update-subscription - Update subscription info
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get user from auth header
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

    const body = await request.json()
    const { endpoint, lastUsedAt, deviceInfo } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      )
    }

    // Get subscription by endpoint
    const subscription = await PushSubscriptionService.getSubscriptionByEndpoint(endpoint)
    
    if (!subscription || subscription.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Update subscription
    await PushSubscriptionService.updateSubscription(subscription.id, {
      last_used_at: lastUsedAt || new Date().toISOString(),
      device_info: deviceInfo
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
