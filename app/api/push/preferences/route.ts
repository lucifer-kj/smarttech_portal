import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'
import { PushSubscriptionService } from '@/services/push-subscription-service'

// GET /api/push/preferences - Get notification preferences
export async function GET(request: NextRequest) {
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

    const preferences = await PushSubscriptionService.getNotificationPreferences(user.id)
    
    if (!preferences) {
      // Create default preferences
      const defaultPreferences = await PushSubscriptionService.createDefaultPreferences(user.id)
      return NextResponse.json({ preferences: defaultPreferences })
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error getting notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to get notification preferences' },
      { status: 500 }
    )
  }
}

// POST /api/push/preferences - Create default preferences
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
    const { userId } = body

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const preferences = await PushSubscriptionService.createDefaultPreferences(user.id)
    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error creating notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to create notification preferences' },
      { status: 500 }
    )
  }
}

// PUT /api/push/preferences - Update notification preferences
export async function PUT(request: NextRequest) {
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
    const { preferences } = body

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences data is required' },
        { status: 400 }
      )
    }

    const updatedPreferences = await PushSubscriptionService.updateNotificationPreferences(
      user.id,
      preferences
    )

    return NextResponse.json({ preferences: updatedPreferences })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}
