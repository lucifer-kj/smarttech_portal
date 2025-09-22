import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'

// GET /api/admin/reconciliation/metrics - Metrics for sync monitoring
export async function GET() {
  const supabase = createAdminClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lastRuns } = await (supabase as any)
      .from('reconciliation_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: failedLast24h } = await (supabase as any)
      .from('reconciliation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: totalJobs } = await (supabase as any)
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: totalClients } = await (supabase as any)
      .from('clients')
      .select('*', { count: 'exact', head: true })

    const metrics = {
      recentRuns: lastRuns || [],
      failedLast24h: failedLast24h || 0,
      totals: {
        jobs: totalJobs || 0,
        clients: totalClients || 0,
      },
    }

    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    console.error('Failed to get reconciliation metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get reconciliation metrics' },
      { status: 500 }
    )
  }
}


