import { NextRequest, NextResponse } from 'next/server'
import { NotificationTriggerService } from '@/services/notification-trigger-service'

// POST /api/webhooks/notifications/technician-arrival - Handle technician arrivals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, jobTitle, technicianName, technicianId, userId } = body

    if (!jobId || !jobTitle || !technicianName || !technicianId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Send notification
    const success = await NotificationTriggerService.sendTechnicianArrivalNotification(
      jobId,
      jobTitle,
      technicianName,
      technicianId,
      userId
    )

    return NextResponse.json({ 
      success,
      message: success ? 'Notification sent successfully' : 'Failed to send notification'
    })
  } catch (error) {
    console.error('Error handling technician arrival notification:', error)
    return NextResponse.json(
      { error: 'Failed to process technician arrival notification' },
      { status: 500 }
    )
  }
}
