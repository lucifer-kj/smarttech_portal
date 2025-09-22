import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

/**
 * Audit Logs API
 * Handles audit log retrieval, filtering, and export
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const action = searchParams.get('action') || 'all';
  const targetType = searchParams.get('target_type') || 'all';
  const dateRange = searchParams.get('date_range') || '7d';

  const supabase = createAdminClient();
  const offset = (page - 1) * limit;

  try {
    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`action.ilike.%${search}%,target_type.ilike.%${search}%,target_id.ilike.%${search}%`);
    }

    if (action !== 'all') {
      query = query.eq('action', action);
    }

    if (targetType !== 'all') {
      query = query.eq('target_type', targetType);
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case '1d':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      query = query.gte('timestamp', startDate.toISOString());
    }

    const { data: logs, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: {
        logs: logs || [],
        totalLogs: count || 0,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      message: `Retrieved ${logs?.length || 0} audit logs`
    });

  } catch (error) {
    console.error('Audit logs API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch audit logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Export audit logs
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'all';
  const targetType = searchParams.get('target_type') || 'all';
  const dateRange = searchParams.get('date_range') || '7d';
  const format = searchParams.get('format') || 'csv';

  const supabase = createAdminClient();

  try {
    // Build query for export
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    // Apply filters
    if (action !== 'all') {
      query = query.eq('action', action);
    }

    if (targetType !== 'all') {
      query = query.eq('target_type', targetType);
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case '1d':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      query = query.gte('timestamp', startDate.toISOString());
    }

    const { data: logs, error } = await query;

    if (error) {
      throw new Error(`Failed to export audit logs: ${error.message}`);
    }

    if (format === 'csv') {
      const csv = convertToCSV(logs || []);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        data: logs,
        message: `Exported ${logs?.length || 0} audit logs`
      });
    }

  } catch (error) {
    console.error('Audit logs export failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to export audit logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Convert audit logs to CSV format
 */
function convertToCSV(logs: Array<{
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  actor_user_id: string;
  created_at: string;
  metadata: Record<string, unknown>;
}>): string {
  const headers = ['ID', 'Action', 'Target Type', 'Target ID', 'Actor User ID', 'Timestamp', 'Metadata'];
  
  const csvRows = [
    headers.join(','),
    ...logs.map(log => [
      log.id,
      `"${log.action}"`,
      `"${log.target_type}"`,
      `"${log.target_id}"`,
      `"${log.actor_user_id}"`,
      `"${log.created_at}"`,
      `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"`
    ].join(','))
  ];

  return csvRows.join('\n');
}
