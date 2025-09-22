import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

/**
 * System Health API
 * Provides system health status for admin monitoring
 */
export async function GET() {
  try {
    const health = await getSystemHealth();

    return NextResponse.json({
      success: true,
      data: health,
      message: 'System health retrieved successfully'
    });

  } catch (error) {
    console.error('Failed to get system health:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get system health',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get comprehensive system health status
 */
async function getSystemHealth(): Promise<{
  servicem8: string;
  webhooks: string;
  database: string;
  overall: string;
  details: {
    servicem8: {
      status: string;
      lastSync?: string;
      errorRate?: number;
      responseTime?: number;
    };
    webhooks: {
      status: string;
      successRate?: number;
      failedEvents?: number;
      lastEvent?: string;
    };
    database: {
      status: string;
      connectionPool?: number;
      queryTime?: number;
    };
  };
}> {
  const health = {
    servicem8: 'unknown',
    webhooks: 'unknown',
    database: 'unknown',
    overall: 'unknown',
    details: {
      servicem8: { status: 'unknown' },
      webhooks: { status: 'unknown' },
      database: { status: 'unknown' },
    },
  };

  try {
    // Test ServiceM8 connection
    const sm8Start = Date.now();
    const sm8Response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/servicem8/test-connection`);
    const sm8ResponseTime = Date.now() - sm8Start;
    
    if (sm8Response.ok) {
      health.servicem8 = 'connected';
      health.details.servicem8 = {
        status: 'connected',
        responseTime: sm8ResponseTime,
      } as typeof health.details.servicem8;
    } else {
      health.servicem8 = 'error';
      health.details.servicem8 = {
        status: 'error',
        responseTime: sm8ResponseTime,
      } as typeof health.details.servicem8;
    }

    // Test webhook health
    const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/management?action=stats`);
    if (webhookResponse.ok) {
      const webhookData = await webhookResponse.json();
      const stats = webhookData.data;
      
      if (stats.successRate > 95) {
        health.webhooks = 'healthy';
      } else if (stats.successRate > 80) {
        health.webhooks = 'warning';
      } else {
        health.webhooks = 'error';
      }

      health.details.webhooks = {
        status: health.webhooks,
        successRate: stats.successRate,
        failedEvents: stats.failed,
        lastEvent: stats.lastEvent,
      } as typeof health.details.webhooks;
    } else {
      health.webhooks = 'error';
      health.details.webhooks = { status: 'error' };
    }

    // Test database connection
    const dbStart = Date.now();
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('users').select('id').limit(1);
    const dbQueryTime = Date.now() - dbStart;

    if (!error) {
      health.database = 'online';
      health.details.database = {
        status: 'online',
        queryTime: dbQueryTime,
      } as typeof health.details.database;
    } else {
      health.database = 'offline';
      health.details.database = {
        status: 'offline',
        queryTime: dbQueryTime,
      } as typeof health.details.database;
    }

    // Determine overall health
    if (health.servicem8 === 'connected' && health.webhooks === 'healthy' && health.database === 'online') {
      health.overall = 'healthy';
    } else if (health.servicem8 === 'error' || health.webhooks === 'error' || health.database === 'offline') {
      health.overall = 'error';
    } else {
      health.overall = 'warning';
    }

    return health;

  } catch (error) {
    console.error('System health check failed:', error);
    
    health.servicem8 = 'error';
    health.webhooks = 'error';
    health.database = 'error';
    health.overall = 'error';

    return health;
  }
}
