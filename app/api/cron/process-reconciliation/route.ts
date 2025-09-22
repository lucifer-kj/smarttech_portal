import { NextRequest, NextResponse } from 'next/server'
import { reconciliationService } from '@/services/reconciliation-service'

// POST /api/cron/process-reconciliation - Trigger scheduled reconciliation
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type } = (await request.json().catch(() => ({}))) as { type?: 'full' | 'incremental' | 'emergency' }
    const result = await reconciliationService.run(type || 'incremental')

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Error processing reconciliation:', error)
    return NextResponse.json(
      { error: 'Failed to process reconciliation' },
      { status: 500 }
    )
  }
}


