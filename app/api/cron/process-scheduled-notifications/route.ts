import { NextRequest, NextResponse } from 'next/server'
import { ScheduledNotificationService } from '@/services/scheduled-notification-service'

// POST /api/cron/process-scheduled-notifications - Process scheduled notifications
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Process scheduled notifications
    const result = await ScheduledNotificationService.processScheduledNotifications()

    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    console.error('Error processing scheduled notifications:', error)
    return NextResponse.json(
      { error: 'Failed to process scheduled notifications' },
      { status: 500 }
    )
  }
}
