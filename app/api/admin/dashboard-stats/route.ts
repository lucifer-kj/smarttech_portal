import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

/**
 * Admin Dashboard Statistics API
 * Provides key metrics and system health data for the admin dashboard
 */
export async function GET() {
  const supabase = createAdminClient();

  try {
    // Get user counts
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: totalClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    // Get job statistics
    const { count: totalJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });

    const { count: pendingQuotes } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Quote');

    const { count: activeJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .in('status', ['Scheduled', 'In Progress']);

    const { count: completedJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Completed');

    // Get revenue data (mock for now - would need actual quote/job data)
    const totalRevenue = 0; // TODO: Calculate from actual quote data
    const monthlyRevenue = 0; // TODO: Calculate from current month

    // Get system health
    const systemHealth = await getSystemHealth();

    // Get recent activity
    const recentActivity = await getRecentActivity(supabase);

    const stats = {
      totalUsers: totalUsers || 0,
      totalClients: totalClients || 0,
      totalJobs: totalJobs || 0,
      pendingQuotes: pendingQuotes || 0,
      activeJobs: activeJobs || 0,
      completedJobs: completedJobs || 0,
      totalRevenue,
      monthlyRevenue,
      systemHealth,
      recentActivity,
    };

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Dashboard statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get system health status
 */
async function getSystemHealth(): Promise<{
  servicem8: string;
  webhooks: string;
  database: string;
}> {
  try {
    // Test ServiceM8 connection
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const sm8Response = await fetch(`${baseUrl}/api/servicem8/test-connection`);
    const sm8Health = sm8Response.ok ? 'connected' : 'error';

    // Test webhook health
    const webhookResponse = await fetch(`${baseUrl}/api/webhooks/management?action=stats`);
    const webhookData = await webhookResponse.ok ? await webhookResponse.json() : null;
    const webhookHealth = webhookData?.data?.successRate > 90 ? 'healthy' : 'warning';

    // Test database connection
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('users').select('id').limit(1);
    const dbHealth = error ? 'offline' : 'online';

    return {
      servicem8: sm8Health,
      webhooks: webhookHealth,
      database: dbHealth,
    };

  } catch (error) {
    console.error('Failed to get system health:', error);
    return {
      servicem8: 'error',
      webhooks: 'error',
      database: 'error',
    };
  }
}

/**
 * Get recent activity from audit logs
 */
async function getRecentActivity(supabase: ReturnType<typeof createAdminClient>): Promise<Array<{
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}>> {
  try {
    const { data: activities, error } = await supabase
      .from('audit_logs')
      .select(`
        id,
        action,
        target_type,
        target_id,
        timestamp,
        metadata
      `)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Failed to fetch recent activity:', error);
      return [];
    }

    return activities.map((activity: {
      id: string;
      action: string;
      timestamp: string;
      metadata: Record<string, unknown>;
    }) => ({
      id: activity.id,
      type: activity.action,
      description: formatActivityDescription({
        action: activity.action,
        target_type: activity.metadata?.target_type as string || 'unknown',
        target_id: activity.metadata?.target_id as string || 'unknown',
        metadata: activity.metadata
      }),
      timestamp: activity.timestamp,
      user: typeof activity.metadata?.user_email === 'string' ? activity.metadata.user_email : 'System',
    }));

  } catch (error) {
    console.error('Failed to get recent activity:', error);
    return [];
  }
}

/**
 * Format activity description for display
 */
function formatActivityDescription(activity: {
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
}): string {
  const { action, target_type } = activity;

  switch (action) {
    case 'user_login':
      return `User logged in`;
    case 'user_created':
      return `New user created`;
    case 'job_created':
      return `New job created`;
    case 'job_updated':
      return `Job updated`;
    case 'quote_approved':
      return `Quote approved`;
    case 'quote_rejected':
      return `Quote rejected`;
    case 'sync_completed':
      return `Data sync completed`;
    case 'webhook_received':
      return `Webhook event received`;
    default:
      return `${action} on ${target_type}`;
  }
}
