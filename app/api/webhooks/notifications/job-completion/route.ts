import { NextRequest, NextResponse } from 'next/server'
import { NotificationTriggerService } from '@/services/notification-trigger-service'

// POST /api/webhooks/notifications/job-completion - Handle job completions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, jobTitle, userId } = body

    if (!jobId || !jobTitle || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Send notification
    const success = await NotificationTriggerService.sendJobCompletionNotification(
      jobId,
      jobTitle,
      userId
    )

    return NextResponse.json({ 
      success,
      message: success ? 'Notification sent successfully' : 'Failed to send notification'
    })
  } catch (error) {
    console.error('Error handling job completion notification:', error)
    return NextResponse.json(
      { error: 'Failed to process job completion notification' },
      { status: 500 }
    )
  }
}
