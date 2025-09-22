import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'

// POST /api/push/notification-clicked - Log notification click
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    // Update notification status to clicked
    const { error } = await supabase.rpc('update_notification_status', {
      p_notification_id: notificationId,
      p_status: 'clicked'
    })

    if (error) {
      throw new Error(`Failed to update notification status: ${error.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging notification click:', error)
    return NextResponse.json(
      { error: 'Failed to log notification click' },
      { status: 500 }
    )
  }
}
