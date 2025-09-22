import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, supabase } from '@/lib/supabase/client';
import { serviceM8Client } from '@/services/servicem8-client';
import { serviceM8SyncService } from '@/services/servicem8-sync';
import { ServiceM8WebhookPayload } from '@/types/servicem8';
import crypto from 'crypto';

/**
 * ServiceM8 Webhook Endpoint
 * Handles incoming webhook events from ServiceM8
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-servicem8-signature');
    
    // Log incoming webhook
    console.log('ServiceM8 webhook received:', {
      signature: signature?.substring(0, 20) + '...',
      bodyLength: body.length,
    });

    // Store webhook event for processing
    const webhookEvent = await storeWebhookEvent({
      payload: body,
      signature: signature || '',
      timestamp: request.headers.get('x-servicem8-timestamp') || '',
      headers: Object.fromEntries(request.headers.entries()),
    });
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const timestamp = request.headers.get('x-servicem8-timestamp') || '';
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValid) {
        await updateWebhookEventStatus(webhookEvent.id, 'failed', 'Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse webhook payload
    let payload: ServiceM8WebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch {
      await updateWebhookEventStatus(webhookEvent.id, 'failed', 'Invalid JSON payload');
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate payload structure
    if (!payload.object_type || !payload.object_uuid || !payload.event_type) {
      await updateWebhookEventStatus(webhookEvent.id, 'failed', 'Invalid payload structure');
      return NextResponse.json(
        { error: 'Invalid payload structure' },
        { status: 400 }
      );
    }

    // Process webhook asynchronously
    processWebhookEvent(webhookEvent.id, payload).catch(error => {
      console.error('Webhook processing failed:', error);
    });

    // Return immediate acknowledgment
    return NextResponse.json({
      success: true,
      message: 'Webhook received and queued for processing',
      eventId: webhookEvent.id,
    });

  } catch (error) {
    console.error('Webhook endpoint error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Verify webhook signature using HMAC-SHA256
 */
function verifyWebhookSignature(
body: string, signature: string, secret: string): boolean {
  try {
    // ServiceM8 typically uses HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    // Compare signatures (remove 'sha256=' prefix if present)
    const cleanSignature = signature.replace('sha256=', '');
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(cleanSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Store webhook event in database
 */
async function storeWebhookEvent(eventData: {
  payload: string;
  signature: string;
  timestamp: string;
  headers: Record<string, string>;
}) {
  const supabase = createAdminClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('webhook_events')
    .insert({
      sm8_event_id: generateEventId(),
      payload: JSON.parse(eventData.payload),
      status: 'queued',
      processed_at: null,
      error_details: null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store webhook event: ${error.message}`);
  }

  return data;
}

/**
 * Update webhook event status
 */
async function updateWebhookEventStatus(
  eventId: string,
  status: 'queued' | 'processing' | 'success' | 'failed',
  errorDetails?: string
) {
  const supabase = createAdminClient();
  
  const updateData: Record<string, unknown> = {
    status,
    processed_at: status === 'success' || status === 'failed' ? new Date().toISOString() : null,
  };

  if (errorDetails) {
    updateData.error_details = errorDetails;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('webhook_events')
    .update(updateData)
    .eq('id', eventId);

  if (error) {
    console.error('Failed to update webhook event status:', error);
  }
}

/**
 * Process webhook event asynchronously
 */
async function processWebhookEvent(
  eventId: string,
  payload: ServiceM8WebhookPayload
) {
  try {
    // Update status to processing
    await updateWebhookEventStatus(eventId, 'processing');

    console.log('Processing webhook event:', {
      eventId,
      objectType: payload.object_type,
      objectUuid: payload.object_uuid,
      eventType: payload.event_type,
    });

    // Process based on object type
    switch (payload.object_type) {
      case 'Job':
        await processJobWebhook(payload);
        break;
      case 'Company':
        await processCompanyWebhook(payload);
        break;
      case 'JobActivity':
        await processJobActivityWebhook(payload);
        break;
      case 'Attachment':
        await processAttachmentWebhook(payload);
        break;
      case 'Staff':
        await processStaffWebhook(payload);
        break;
      default:
        console.warn(`Unknown object type: ${payload.object_type}`);
    }

    // Broadcast realtime updates
    await broadcastRealtimeUpdate(payload);

    // Update status to success
    await updateWebhookEventStatus(eventId, 'success');

  } catch (error) {
    console.error('Webhook processing failed:', error);
    await updateWebhookEventStatus(
      eventId,
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Process Job webhook events
 */
async function processJobWebhook(payload: ServiceM8WebhookPayload) {
  try {
    // Get job data from ServiceM8
    const jobsResponse = await serviceM8Client.getJobs('', {
      // We need to get the company UUID first
    });

    // Find the specific job
    const job = jobsResponse.data.find(j => j.uuid === payload.object_uuid);
    if (!job) {
      throw new Error(`Job not found: ${payload.object_uuid}`);
    }

    // Sync the job data
    await serviceM8SyncService.syncJobsForCompany(job.company_uuid, {
      includeActivities: true,
      includeAttachments: true,
      includeMaterials: true,
    });

    console.log(`Job webhook processed: ${payload.object_uuid}`);

  } catch (error) {
    console.error('Job webhook processing failed:', error);
    throw error;
  }
}

/**
 * Process Company webhook events
 */
async function processCompanyWebhook(payload: ServiceM8WebhookPayload) {
  try {
    // Get company data from ServiceM8
    const companiesResponse = await serviceM8Client.getClients();
    const company = companiesResponse.data.find(c => c.uuid === payload.object_uuid);
    
    if (!company) {
      throw new Error(`Company not found: ${payload.object_uuid}`);
    }

    // Sync the company data
    await serviceM8SyncService.upsertCompany(company);

    console.log(`Company webhook processed: ${payload.object_uuid}`);

  } catch (error) {
    console.error('Company webhook processing failed:', error);
    throw error;
  }
}

/**
 * Process JobActivity webhook events
 */
async function processJobActivityWebhook(payload: ServiceM8WebhookPayload) {
  try {
    // Get job activities from ServiceM8
    const activitiesResponse = await serviceM8Client.getJobActivities(payload.object_uuid);
    
    if (activitiesResponse.data.length === 0) {
      throw new Error(`Job activities not found for job: ${payload.object_uuid}`);
    }

    // Sync the activities
    await serviceM8SyncService.syncJobActivities(payload.object_uuid, activitiesResponse.data);

    console.log(`JobActivity webhook processed: ${payload.object_uuid}`);

  } catch (error) {
    console.error('JobActivity webhook processing failed:', error);
    throw error;
  }
}

/**
 * Process Attachment webhook events
 */
async function processAttachmentWebhook(payload: ServiceM8WebhookPayload) {
  try {
    // Get job attachments from ServiceM8
    const attachmentsResponse = await serviceM8Client.getJobAttachments(payload.object_uuid);
    
    if (attachmentsResponse.data.length === 0) {
      throw new Error(`Job attachments not found for job: ${payload.object_uuid}`);
    }

    // Sync the attachments
    await serviceM8SyncService.syncJobAttachments(payload.object_uuid, attachmentsResponse.data);

    console.log(`Attachment webhook processed: ${payload.object_uuid}`);

  } catch (error) {
    console.error('Attachment webhook processing failed:', error);
    throw error;
  }
}

/**
 * Process Staff webhook events
 */
async function processStaffWebhook(payload: ServiceM8WebhookPayload) {
  try {
    // Staff updates are typically handled through job activities
    // For now, we'll just log the event
    console.log(`Staff webhook received: ${payload.object_uuid}`);

  } catch (error) {
    console.error('Staff webhook processing failed:', error);
    throw error;
  }
}

/**
 * Broadcast realtime updates via Supabase Realtime
 */
async function broadcastRealtimeUpdate(payload: ServiceM8WebhookPayload) {
  try {
    // Determine the channel based on object type
    let channel = '';
    let data: Record<string, unknown> = {};

    switch (payload.object_type) {
      case 'Job':
        channel = 'jobs';
        data = {
          type: 'job_update',
          object_uuid: payload.object_uuid,
          event_type: payload.event_type,
          changes: payload.changes,
        };
        break;
      case 'Company':
        channel = 'companies';
        data = {
          type: 'company_update',
          object_uuid: payload.object_uuid,
          event_type: payload.event_type,
          changes: payload.changes,
        };
        break;
      case 'JobActivity':
        channel = 'job_activities';
        data = {
          type: 'activity_update',
          object_uuid: payload.object_uuid,
          event_type: payload.event_type,
          changes: payload.changes,
        };
        break;
      case 'Attachment':
        channel = 'attachments';
        data = {
          type: 'attachment_update',
          object_uuid: payload.object_uuid,
          event_type: payload.event_type,
          changes: payload.changes,
        };
        break;
    }

    if (channel) {
      // Broadcast to Supabase Realtime
      await supabase
        .channel(channel)
        .send({
          type: 'broadcast',
          event: 'webhook_update',
          payload: data,
        });

      console.log(`Realtime update broadcasted to channel: ${channel}`);
    }

  } catch (error) {
    console.error('Failed to broadcast realtime update:', error);
    // Don't throw error as this is not critical
  }
}

/**
 * Generate unique event ID
 */
function generateEventId(): string {
  return `sm8_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Handle GET requests for webhook health check
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'ServiceM8 webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
