import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

/**
 * System Alerts API
 * Handles system alert management and monitoring
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'all';
  const category = searchParams.get('category') || 'all';
  const showResolved = searchParams.get('show_resolved') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50');

  const supabase = createAdminClient();

  try {
    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('system_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (filter === 'active') {
      query = query.eq('resolved', false);
    } else if (filter === 'resolved') {
      query = query.eq('resolved', true);
    } else if (!showResolved) {
      query = query.eq('resolved', false);
    }

    if (category !== 'all') {
      query = query.eq('type', category);
    }

    const { data: alerts, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch system alerts: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: alerts || [],
      message: `Retrieved ${alerts?.length || 0} system alerts`
    });

  } catch (error) {
    console.error('System alerts API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch system alerts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Create new system alert
 */
export async function POST(request: NextRequest) {
  const { type, title, message, metadata } = await request.json();
  const supabase = createAdminClient();

  if (!type || !title || !message) {
    return NextResponse.json(
      { success: false, error: 'Type, title, and message are required' },
      { status: 400 }
    );
  }

  try {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: alert, error } = await (supabase as any)
      .from('system_alerts')
      .insert({
        id: alertId,
        type,
        title,
        message,
        metadata: metadata || {},
        resolved: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create system alert: ${error.message}`);
    }

    // Log the action
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('audit_logs')
      .insert({
        actor_user_id: 'system',
        action: 'system_alert_created',
        target_type: 'alert',
        target_id: alertId,
        metadata: { type, title },
        timestamp: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      data: alert,
      message: 'System alert created successfully'
    });

  } catch (error) {
    console.error('System alert creation failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create system alert',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
