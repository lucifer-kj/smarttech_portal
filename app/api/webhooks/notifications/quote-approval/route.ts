import { NextRequest, NextResponse } from 'next/server'
import { NotificationTriggerService } from '@/services/notification-trigger-service'

// POST /api/webhooks/notifications/quote-approval - Handle quote approval requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quoteId, jobTitle, amount, userId } = body

    if (!quoteId || !jobTitle || !amount || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Send notification
    const success = await NotificationTriggerService.sendQuoteApprovalNotification(
      quoteId,
      jobTitle,
      amount,
      userId
    )

    return NextResponse.json({ 
      success,
      message: success ? 'Notification sent successfully' : 'Failed to send notification'
    })
  } catch (error) {
    console.error('Error handling quote approval notification:', error)
    return NextResponse.json(
      { error: 'Failed to process quote approval notification' },
      { status: 500 }
    )
  }
}
