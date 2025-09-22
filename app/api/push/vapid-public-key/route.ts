import { NextResponse } from 'next/server'
import { pushNotificationService } from '@/services/push-notification-service'

// GET /api/push/vapid-public-key - Get VAPID public key
export async function GET() {
  try {
    // Initialize push notification service
    await pushNotificationService.initialize()
    
    const publicKey = pushNotificationService.getPublicKey()
    
    return NextResponse.json({ publicKey })
  } catch (error) {
    console.error('Error getting VAPID public key:', error)
    return NextResponse.json(
      { error: 'Failed to get VAPID public key' },
      { status: 500 }
    )
  }
}
