import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

/**
 * Reconciliation History API
 * Retrieves reconciliation history and statistics
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const type = searchParams.get('type') || 'all';

  const supabase = createAdminClient();

  try {
    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('reconciliation_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    // Apply type filter
    if (type !== 'all') {
      query = query.eq('type', type);
    }

    const { data: reconciliations, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch reconciliation history: ${error.message}`);
    }

    // Get statistics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: stats, error: statsError } = await (supabase as any)
      .from('reconciliation_logs')
      .select('type, status, records_processed, errors, duration')
      .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    if (statsError) {
      console.error('Failed to fetch reconciliation stats:', statsError);
    }

    // Calculate statistics
    const statistics = {
      totalReconciliations: reconciliations?.length || 0,
      successfulReconciliations: (stats as Array<{ status?: string }>)?.filter(s => s.status === 'completed').length || 0,
      failedReconciliations: (stats as Array<{ status?: string }>)?.filter(s => s.status === 'failed').length || 0,
      averageDuration: (stats as Array<{ duration?: number }>)?.reduce((acc, s) => acc + (s.duration || 0), 0) / ((stats as Array<unknown>)?.length || 1),
      totalRecordsProcessed: (stats as Array<{ records_processed?: number }>)?.reduce((acc, s) => acc + (s.records_processed || 0), 0) || 0,
      totalErrors: (stats as Array<{ errors?: number }>)?.reduce((acc, s) => acc + (s.errors || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        reconciliations: reconciliations || [],
        statistics,
      },
      message: `Retrieved ${reconciliations?.length || 0} reconciliation records`
    });

  } catch (error) {
    console.error('Reconciliation history API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch reconciliation history',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
