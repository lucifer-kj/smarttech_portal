import { NextRequest, NextResponse } from 'next/server'
import { NotificationTriggerService } from '@/services/notification-trigger-service'

// POST /api/webhooks/notifications/emergency-response - Handle emergency responses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emergencyId, technicianName, eta, userId } = body

    if (!emergencyId || !technicianName || !eta || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Send notification
    const success = await NotificationTriggerService.sendEmergencyResponseNotification(
      emergencyId,
      technicianName,
      eta,
      userId
    )

    return NextResponse.json({ 
      success,
      message: success ? 'Notification sent successfully' : 'Failed to send notification'
    })
  } catch (error) {
    console.error('Error handling emergency response notification:', error)
    return NextResponse.json(
      { error: 'Failed to process emergency response notification' },
      { status: 500 }
    )
  }
}
