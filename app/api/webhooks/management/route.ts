import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { webhookProcessor } from '@/services/webhook-processor';

/**
 * ServiceM8 Webhook Management API
 * Handles webhook event monitoring, retry, and management
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const status = searchParams.get('status');
  const eventId = searchParams.get('event_id');

  const supabase = createAdminClient();

  try {
    switch (action) {
      case 'stats':
        const stats = await webhookProcessor.getProcessingStats();
        return NextResponse.json({
          success: true,
          data: stats,
          message: 'Webhook processing statistics retrieved'
        });

      case 'events':
        let query = supabase
          .from('webhook_events')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) {
          query = query.eq('status', status);
        }

        const { data: events, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch webhook events: ${error.message}`);
        }

        return NextResponse.json({
          success: true,
          data: events,
          message: `Retrieved ${events.length} webhook events`
        });

      case 'event':
        if (!eventId) {
          return NextResponse.json(
            { success: false, error: 'Event ID is required' },
            { status: 400 }
          );
        }

        const { data: event, error: eventError } = await supabase
          .from('webhook_events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (eventError) {
          throw new Error(`Failed to fetch webhook event: ${eventError.message}`);
        }

        return NextResponse.json({
          success: true,
          data: event,
          message: 'Webhook event retrieved'
        });

      case 'failed_events':
        const { data: failedEvents, error: failedError } = await supabase
          .from('webhook_events')
          .select('*')
          .eq('status', 'failed')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (failedError) {
          throw new Error(`Failed to fetch failed events: ${failedError.message}`);
        }

        return NextResponse.json({
          success: true,
          data: failedEvents,
          message: `Retrieved ${failedEvents.length} failed webhook events`
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Webhook management API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Webhook management operation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle webhook management operations
 */
export async function POST(request: NextRequest) {
  const { action, eventId, eventIds } = await request.json();

  try {
    switch (action) {
      case 'retry_event':
        if (!eventId) {
          return NextResponse.json(
            { success: false, error: 'Event ID is required' },
            { status: 400 }
          );
        }

        // Get the event data
        const supabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: event, error: eventError } = await (supabase as any)
          .from('webhook_events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (eventError) {
          throw new Error(`Failed to fetch event: ${eventError.message}`);
        }

        // Retry the event
        await webhookProcessor.processEvent(eventId, event.payload);

        return NextResponse.json({
          success: true,
          message: `Event ${eventId} retry initiated`
        });

      case 'retry_failed_events':
        const retryCount = await webhookProcessor.retryFailedEvents();
        
        return NextResponse.json({
          success: true,
          data: { retryCount },
          message: `Retried ${retryCount} failed events`
        });

      case 'retry_multiple_events':
        if (!eventIds || !Array.isArray(eventIds)) {
          return NextResponse.json(
            { success: false, error: 'Event IDs array is required' },
            { status: 400 }
          );
        }

        const supabase2 = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: events, error: eventsError } = await (supabase2 as any)
          .from('webhook_events')
          .select('*')
          .in('id', eventIds);

        if (eventsError) {
          throw new Error(`Failed to fetch events: ${eventsError.message}`);
        }

        let successCount = 0;
        for (const event of events) {
          try {
            await webhookProcessor.processEvent(event.id, event.payload);
            successCount++;
          } catch (error) {
            console.error(`Failed to retry event ${event.id}:`, error);
          }
        }

        return NextResponse.json({
          success: true,
          data: { successCount, totalCount: events.length },
          message: `Retried ${successCount}/${events.length} events`
        });

      case 'delete_event':
        if (!eventId) {
          return NextResponse.json(
            { success: false, error: 'Event ID is required' },
            { status: 400 }
          );
        }

        const supabase3 = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: deleteError } = await (supabase3 as any)
          .from('webhook_events')
          .delete()
          .eq('id', eventId);

        if (deleteError) {
          throw new Error(`Failed to delete event: ${deleteError.message}`);
        }

        return NextResponse.json({
          success: true,
          message: `Event ${eventId} deleted`
        });

      case 'delete_old_events':
        const days = parseInt(request.headers.get('x-delete-days') || '30');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const supabase4 = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: deletedEvents, error: deleteOldError } = await (supabase4 as any)
          .from('webhook_events')
          .delete()
          .lt('created_at', cutoffDate.toISOString())
          .select('id');

        if (deleteOldError) {
          throw new Error(`Failed to delete old events: ${deleteOldError.message}`);
        }

        return NextResponse.json({
          success: true,
          data: { deletedCount: deletedEvents.length },
          message: `Deleted ${deletedEvents.length} events older than ${days} days`
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Webhook management operation failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Webhook management operation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
