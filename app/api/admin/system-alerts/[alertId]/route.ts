import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

/**
 * Individual System Alert Management API
 * Handles alert resolution and dismissal
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  const { alertId } = await params;
  const { action } = await request.json();
  const supabase = createAdminClient();

  try {
    switch (action) {
      case 'resolve':
        return await resolveAlert(alertId, supabase);
      case 'dismiss':
        return await dismissAlert(alertId, supabase);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Alert action failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Alert action failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Resolve an alert
 */
async function resolveAlert(alertId: string, supabase: ReturnType<typeof createAdminClient>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('system_alerts')
    .update({ 
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: 'admin', // TODO: Get from auth context
    })
    .eq('id', alertId);

  if (error) {
    throw new Error(`Failed to resolve alert: ${error.message}`);
  }

  // Log the action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('audit_logs')
    .insert({
      actor_user_id: 'admin', // TODO: Get from auth context
      action: 'system_alert_resolved',
      target_type: 'alert',
      target_id: alertId,
      metadata: { alertId },
      timestamp: new Date().toISOString(),
    });

  return NextResponse.json({
    success: true,
    message: 'Alert resolved successfully'
  });
}

/**
 * Dismiss an alert
 */
async function dismissAlert(alertId: string, supabase: ReturnType<typeof createAdminClient>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('system_alerts')
    .update({ 
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: 'admin', // TODO: Get from auth context
      dismissed: true,
    })
    .eq('id', alertId);

  if (error) {
    throw new Error(`Failed to dismiss alert: ${error.message}`);
  }

  // Log the action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('audit_logs')
    .insert({
      actor_user_id: 'admin', // TODO: Get from auth context
      action: 'system_alert_dismissed',
      target_type: 'alert',
      target_id: alertId,
      metadata: { alertId },
      timestamp: new Date().toISOString(),
    });

  return NextResponse.json({
    success: true,
    message: 'Alert dismissed successfully'
  });
}
