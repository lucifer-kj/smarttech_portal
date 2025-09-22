import { createAdminClient } from '@/lib/supabase/client';
import { serviceM8Client } from '@/services/servicem8-client';
import { serviceM8SyncService } from '@/services/servicem8-sync';
import { ServiceM8WebhookPayload, ServiceM8JobActivity, ServiceM8Attachment, ServiceM8Job, ServiceM8Company } from '@/types/servicem8';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * ServiceM8 Webhook Event Processor
 * Handles advanced webhook event processing with retry logic and idempotency
 */
export class ServiceM8WebhookProcessor {
  private supabase: SupabaseClient;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second base delay

  constructor() {
    this.supabase = createAdminClient();
  }

  /**
   * Process webhook event with retry logic
   */
  async processEvent(
    eventId: string,
    payload: ServiceM8WebhookPayload,
    attempt: number = 1
  ): Promise<void> {
    try {
      console.log(`Processing webhook event ${eventId} (attempt ${attempt})`);

      // Check if event was already processed successfully
      if (await this.isEventProcessed(eventId)) {
        console.log(`Event ${eventId} already processed successfully`);
        return;
      }

      // Update status to processing
      await this.updateEventStatus(eventId, 'processing');

      // Process based on event type and object type
      await this.processEventByType(payload);

      // Update status to success
      await this.updateEventStatus(eventId, 'success');

      // Broadcast realtime updates
      await this.broadcastRealtimeUpdate(payload);

      console.log(`Webhook event ${eventId} processed successfully`);

    } catch (error) {
      console.error(`Webhook event ${eventId} processing failed (attempt ${attempt}):`, error);

      if (attempt < this.maxRetries) {
        // Retry with exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying event ${eventId} in ${delay}ms`);
        
        setTimeout(() => {
          this.processEvent(eventId, payload, attempt + 1);
        }, delay);
      } else {
        // Max retries reached, mark as failed
        await this.updateEventStatus(
          eventId,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  }

  /**
   * Process event based on object type and event type
   */
  private async processEventByType(payload: ServiceM8WebhookPayload): Promise<void> {
    const { object_type, event_type, object_uuid, changes } = payload;

    switch (object_type) {
      case 'Job':
        await this.processJobEvent(event_type, object_uuid, changes);
        break;
      case 'Company':
        await this.processCompanyEvent(event_type, object_uuid, changes);
        break;
      case 'JobActivity':
        await this.processJobActivityEvent(event_type, object_uuid, changes);
        break;
      case 'Attachment':
        await this.processAttachmentEvent(event_type, object_uuid, changes);
        break;
      case 'Staff':
        await this.processStaffEvent(event_type, object_uuid, changes);
        break;
      default:
        console.warn(`Unknown object type: ${object_type}`);
    }
  }

  /**
   * Process Job events
   */
  private async processJobEvent(
    eventType: string,
    jobUuid: string,
    changes?: Record<string, unknown>
  ): Promise<void> {
    console.log(`Processing Job ${eventType} event for ${jobUuid}`);

    // Get job data from ServiceM8
    const jobsResponse = await serviceM8Client.getJobs('', {
      // We need to find the job by UUID
    });

    const job = jobsResponse.data.find(j => j.uuid === jobUuid);
    if (!job) {
      throw new Error(`Job not found: ${jobUuid}`);
    }

    // Sync the job data
    await serviceM8SyncService.syncJobsForCompany(job.company_uuid, {
      includeActivities: true,
      includeAttachments: true,
      includeMaterials: true,
    });

    // Handle specific event types
    switch (eventType) {
      case 'created':
        await this.handleJobCreated(job);
        break;
      case 'updated':
        await this.handleJobUpdated(job, changes);
        break;
      case 'status_changed':
        await this.handleJobStatusChanged(job, changes);
        break;
      case 'quote_sent':
        await this.handleQuoteSent(job);
        break;
      case 'quote_approved':
        await this.handleQuoteApproved(job);
        break;
      case 'quote_rejected':
        await this.handleQuoteRejected(job);
        break;
    }
  }

  /**
   * Process Company events
   */
  private async processCompanyEvent(
    eventType: string,
    companyUuid: string,
    changes?: Record<string, unknown>
  ): Promise<void> {
    console.log(`Processing Company ${eventType} event for ${companyUuid}`);

    // Get company data from ServiceM8
    const companiesResponse = await serviceM8Client.getClients();
    const company = companiesResponse.data.find(c => c.uuid === companyUuid);
    
    if (!company) {
      throw new Error(`Company not found: ${companyUuid}`);
    }

    // Sync the company data
    await serviceM8SyncService.upsertCompany(company);

    // Handle specific event types
    switch (eventType) {
      case 'created':
        await this.handleCompanyCreated(company);
        break;
      case 'updated':
        await this.handleCompanyUpdated(company, changes);
        break;
    }
  }

  /**
   * Process JobActivity events
   */
  private async processJobActivityEvent(
    eventType: string,
    jobUuid: string,
    changes?: Record<string, unknown>
  ): Promise<void> {
    console.log(`Processing JobActivity ${eventType} event for job ${jobUuid}`);

    // Get job activities from ServiceM8
    const activitiesResponse = await serviceM8Client.getJobActivities(jobUuid);
    
    if (activitiesResponse.data.length === 0) {
      throw new Error(`Job activities not found for job: ${jobUuid}`);
    }

    // Sync the activities
    await serviceM8SyncService.syncJobActivities(jobUuid, activitiesResponse.data);

    // Handle specific event types
    switch (eventType) {
      case 'created':
        await this.handleActivityCreated(jobUuid, activitiesResponse.data);
        break;
      case 'updated':
        await this.handleActivityUpdated(jobUuid, changes);
        break;
      case 'completed':
        await this.handleActivityCompleted(jobUuid, changes);
        break;
    }
  }

  /**
   * Process Attachment events
   */
  private async processAttachmentEvent(
    eventType: string,
    jobUuid: string,
    changes?: Record<string, unknown>
  ): Promise<void> {
    console.log(`Processing Attachment ${eventType} event for job ${jobUuid}`);

    // Get job attachments from ServiceM8
    const attachmentsResponse = await serviceM8Client.getJobAttachments(jobUuid);
    
    if (attachmentsResponse.data.length === 0) {
      throw new Error(`Job attachments not found for job: ${jobUuid}`);
    }

    // Sync the attachments
    await serviceM8SyncService.syncJobAttachments(jobUuid, attachmentsResponse.data);

    // Handle specific event types
    switch (eventType) {
      case 'created':
        await this.handleAttachmentCreated(jobUuid, attachmentsResponse.data);
        break;
      case 'updated':
        await this.handleAttachmentUpdated(jobUuid, changes);
        break;
    }
  }

  /**
   * Process Staff events
   */
  private async processStaffEvent(
    eventType: string,
    staffUuid: string,
    _changes?: Record<string, unknown>
  ): Promise<void> {
    console.log(`Processing Staff ${eventType} event for ${staffUuid}`);

    // Staff updates are typically handled through job activities
    // For now, we'll just log the event
    console.log(`Staff event processed: ${staffUuid}`);
  }

  // ===== EVENT HANDLERS =====

  /**
   * Handle job created event
   */
  private async handleJobCreated(job: ServiceM8Job): Promise<void> {
    console.log(`Job created: ${job.uuid}`);
    // Could trigger notifications, create initial records, etc.
  }

  /**
   * Handle job updated event
   */
  private async handleJobUpdated(job: ServiceM8Job, changes?: Record<string, unknown>): Promise<void> {
    console.log(`Job updated: ${job.uuid}`, changes);
    // Could trigger notifications for specific changes
  }

  /**
   * Handle job status changed event
   */
  private async handleJobStatusChanged(job: ServiceM8Job, changes?: Record<string, unknown>): Promise<void> {
    console.log(`Job status changed: ${job.uuid}`, changes);
    // Could trigger status-specific notifications
  }

  /**
   * Handle quote sent event
   */
  private async handleQuoteSent(job: ServiceM8Job): Promise<void> {
    console.log(`Quote sent for job: ${job.uuid}`);
    // Could trigger quote notification to client
  }

  /**
   * Handle quote approved event
   */
  private async handleQuoteApproved(job: ServiceM8Job): Promise<void> {
    console.log(`Quote approved for job: ${job.uuid}`);
    // Could trigger approval notifications
  }

  /**
   * Handle quote rejected event
   */
  private async handleQuoteRejected(job: ServiceM8Job): Promise<void> {
    console.log(`Quote rejected for job: ${job.uuid}`);
    // Could trigger rejection notifications
  }

  /**
   * Handle company created event
   */
  private async handleCompanyCreated(company: ServiceM8Company): Promise<void> {
    console.log(`Company created: ${company.uuid}`);
    // Could trigger welcome notifications
  }

  /**
   * Handle company updated event
   */
  private async handleCompanyUpdated(company: ServiceM8Company, changes?: Record<string, unknown>): Promise<void> {
    console.log(`Company updated: ${company.uuid}`, changes);
    // Could trigger update notifications
  }

  /**
   * Handle activity created event
   */
  private async handleActivityCreated(jobUuid: string, _activities: ServiceM8JobActivity[]): Promise<void> {
    console.log(`Activity created for job: ${jobUuid}`);
    // Could trigger activity notifications
  }

  /**
   * Handle activity updated event
   */
  private async handleActivityUpdated(jobUuid: string, changes?: Record<string, unknown>): Promise<void> {
    console.log(`Activity updated for job: ${jobUuid}`, changes);
    // Could trigger update notifications
  }

  /**
   * Handle activity completed event
   */
  private async handleActivityCompleted(jobUuid: string, changes?: Record<string, unknown>): Promise<void> {
    console.log(`Activity completed for job: ${jobUuid}`, changes);
    // Could trigger completion notifications
  }

  /**
   * Handle attachment created event
   */
  private async handleAttachmentCreated(jobUuid: string, _attachments: ServiceM8Attachment[]): Promise<void> {
    console.log(`Attachment created for job: ${jobUuid}`);
    // Could trigger attachment notifications
  }

  /**
   * Handle attachment updated event
   */
  private async handleAttachmentUpdated(jobUuid: string, changes?: Record<string, unknown>): Promise<void> {
    console.log(`Attachment updated for job: ${jobUuid}`, changes);
    // Could trigger update notifications
  }

  // ===== UTILITY METHODS =====

  /**
   * Check if event was already processed successfully
   */
  private async isEventProcessed(eventId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('webhook_events')
      .select('status')
      .eq('id', eventId)
      .single();

    return (data as { status?: string } | null)?.status === 'success';
  }

  /**
   * Update webhook event status
   */
  private async updateEventStatus(
    eventId: string,
    status: 'queued' | 'processing' | 'success' | 'failed',
    errorDetails?: string
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
      processed_at: status === 'success' || status === 'failed' ? new Date().toISOString() : null,
    };

    if (errorDetails) {
      updateData.error_details = errorDetails;
    }

    const { error } = await this.supabase
      .from('webhook_events')
      .update(updateData)
      .eq('id', eventId);

    if (error) {
      console.error('Failed to update webhook event status:', error);
    }
  }

  /**
   * Broadcast realtime updates via Supabase Realtime
   */
  private async broadcastRealtimeUpdate(payload: ServiceM8WebhookPayload): Promise<void> {
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
            timestamp: payload.timestamp,
          };
          break;
        case 'Company':
          channel = 'companies';
          data = {
            type: 'company_update',
            object_uuid: payload.object_uuid,
            event_type: payload.event_type,
            changes: payload.changes,
            timestamp: payload.timestamp,
          };
          break;
        case 'JobActivity':
          channel = 'job_activities';
          data = {
            type: 'activity_update',
            object_uuid: payload.object_uuid,
            event_type: payload.event_type,
            changes: payload.changes,
            timestamp: payload.timestamp,
          };
          break;
        case 'Attachment':
          channel = 'attachments';
          data = {
            type: 'attachment_update',
            object_uuid: payload.object_uuid,
            event_type: payload.event_type,
            changes: payload.changes,
            timestamp: payload.timestamp,
          };
          break;
      }

      if (channel) {
        // Broadcast to Supabase Realtime
        await this.supabase
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
   * Get webhook processing statistics
   */
  async getProcessingStats(): Promise<{
    total: number;
    queued: number;
    processing: number;
    success: number;
    failed: number;
    successRate: number;
  }> {
    const { data, error } = await this.supabase
      .from('webhook_events')
      .select('status');

    if (error) {
      throw new Error(`Failed to get webhook stats: ${error.message}`);
    }

    const stats = data.reduce((acc, event) => {
      acc.total++;
      const status = (event as { status: string }).status;
      if (status in acc) {
        (acc as Record<string, number>)[status]++;
      }
      return acc;
    }, {
      total: 0,
      queued: 0,
      processing: 0,
      success: 0,
      failed: 0,
      successRate: 0,
    });

    stats.successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;

    return stats;
  }

  /**
   * Retry failed webhook events
   */
  async retryFailedEvents(): Promise<number> {
    const { data, error } = await this.supabase
      .from('webhook_events')
      .select('*')
      .eq('status', 'failed')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get failed events: ${error.message}`);
    }

    let retryCount = 0;
    for (const event of data) {
      try {
        await this.processEvent((event as { id: string; payload: ServiceM8WebhookPayload }).id, (event as { id: string; payload: ServiceM8WebhookPayload }).payload);
        retryCount++;
      } catch (error) {
        console.error(`Failed to retry event ${(event as { id: string }).id}:`, error);
      }
    }

    return retryCount;
  }
}

// Export singleton instance
export const webhookProcessor = new ServiceM8WebhookProcessor();
