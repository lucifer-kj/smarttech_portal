import { NextRequest, NextResponse } from 'next/server'
// import { createAdminClient } from '@/lib/supabase/client' // TODO: Implement webhook functionality
import { NotificationTriggerService } from '@/services/notification-trigger-service'

// POST /api/webhooks/notifications/job-status-change - Handle job status changes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, jobTitle, oldStatus, newStatus, userId } = body

    if (!jobId || !jobTitle || !oldStatus || !newStatus || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Send notification
    const success = await NotificationTriggerService.sendJobStatusChangeNotification(
      jobId,
      jobTitle,
      oldStatus,
      newStatus,
      userId
    )

    return NextResponse.json({ 
      success,
      message: success ? 'Notification sent successfully' : 'Failed to send notification'
    })
  } catch (error) {
    console.error('Error handling job status change notification:', error)
    return NextResponse.json(
      { error: 'Failed to process job status change notification' },
      { status: 500 }
    )
  }
}
