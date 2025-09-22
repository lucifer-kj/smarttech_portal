import { NextResponse } from 'next/server'
import { reconciliationService } from '@/services/reconciliation-service'

// GET /api/admin/reconciliation/checks - Run data consistency checks
export async function GET() {
  try {
    const checks = await reconciliationService.performConsistencyChecks()
    return NextResponse.json({ success: true, data: checks })
  } catch (error) {
    console.error('Consistency checks failed:', error)
    return NextResponse.json(
      { success: false, error: 'Consistency checks failed' },
      { status: 500 }
    )
  }
}


