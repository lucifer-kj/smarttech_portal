import { createAdminClient } from '@/lib/supabase/client';
import { serviceM8Client } from './servicem8-client';
import {
  ServiceM8Job,
  ServiceM8Company,
  ServiceM8JobActivity,
  ServiceM8Material,
  ServiceM8Attachment,
  ServiceM8SyncStatus,
} from '@/types/servicem8';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * ServiceM8 Data Synchronization Service
 * Handles syncing ServiceM8 data to Supabase database
 */
export class ServiceM8SyncService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createAdminClient();
  }

  /**
   * Sync all companies from ServiceM8 to database
   */
  async syncCompanies(): Promise<ServiceM8SyncStatus> {
    const status: ServiceM8SyncStatus = {
      lastSync: new Date().toISOString(),
      totalRecords: 0,
      syncedRecords: 0,
      failedRecords: 0,
      errors: [],
    };

    try {
      // Get all companies from ServiceM8
      const response = await serviceM8Client.getClients();
      const companies = response.data;
      status.totalRecords = companies.length;

      // Process each company
      for (const company of companies) {
        try {
          await this.upsertCompany(company);
          status.syncedRecords++;
        } catch (error) {
          status.failedRecords++;
          status.errors.push(
            `Failed to sync company ${company.uuid}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Log sync completion
      await this.logSyncActivity('companies', status);
    } catch (error) {
      status.errors.push(
        `Failed to fetch companies: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return status;
  }

  /**
   * Sync jobs for a specific company
   */
  async syncJobsForCompany(
    companyUuid: string,
    options: {
      includeActivities?: boolean;
      includeAttachments?: boolean;
      includeMaterials?: boolean;
      dateRange?: { start: string; end: string };
    } = {}
  ): Promise<ServiceM8SyncStatus> {
    const status: ServiceM8SyncStatus = {
      lastSync: new Date().toISOString(),
      totalRecords: 0,
      syncedRecords: 0,
      failedRecords: 0,
      errors: [],
    };

    try {
      // Get jobs from ServiceM8
      const response = await serviceM8Client.getJobs(companyUuid, options);
      const jobs = response.data;
      status.totalRecords = jobs.length;

      // Process each job
      for (const job of jobs) {
        try {
          await this.upsertJob(job);
          status.syncedRecords++;

          // Sync related data if requested
          if (options.includeActivities && job.activities) {
            await this.syncJobActivities(job.uuid, job.activities);
          }
          if (options.includeAttachments && job.attachments) {
            await this.syncJobAttachments(job.uuid, job.attachments);
          }
          if (options.includeMaterials && job.materials) {
            await this.syncJobMaterials(job.uuid, job.materials);
          }
        } catch (error) {
          status.failedRecords++;
          status.errors.push(
            `Failed to sync job ${job.uuid}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Log sync completion
      await this.logSyncActivity('jobs', status, { companyUuid });
    } catch (error) {
      status.errors.push(
        `Failed to fetch jobs for company ${companyUuid}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return status;
  }

  /**
   * Sync quotes for a specific company
   */
  async syncQuotesForCompany(
    companyUuid: string,
    options: {
      includeActivities?: boolean;
      includeAttachments?: boolean;
      includeMaterials?: boolean;
    } = {}
  ): Promise<ServiceM8SyncStatus> {
    const status: ServiceM8SyncStatus = {
      lastSync: new Date().toISOString(),
      totalRecords: 0,
      syncedRecords: 0,
      failedRecords: 0,
      errors: [],
    };

    try {
      // Get quotes from ServiceM8
      const response = await serviceM8Client.getQuotes(companyUuid, options);
      const quotes = response.data;
      status.totalRecords = quotes.length;

      // Process each quote
      for (const quote of quotes) {
        try {
          await this.upsertJob(quote);
          await this.upsertQuote(quote);
          status.syncedRecords++;

          // Sync related data if requested
          if (options.includeActivities && quote.activities) {
            await this.syncJobActivities(quote.uuid, quote.activities);
          }
          if (options.includeAttachments && quote.attachments) {
            await this.syncJobAttachments(quote.uuid, quote.attachments);
          }
          if (options.includeMaterials && quote.materials) {
            await this.syncJobMaterials(quote.uuid, quote.materials);
          }
        } catch (error) {
          status.failedRecords++;
          status.errors.push(
            `Failed to sync quote ${quote.uuid}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Log sync completion
      await this.logSyncActivity('quotes', status, { companyUuid });
    } catch (error) {
      status.errors.push(
        `Failed to fetch quotes for company ${companyUuid}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return status;
  }

  /**
   * Upsert company data
   */
  public async upsertCompany(company: ServiceM8Company): Promise<void> {
    const companyData = {
      uuid: company.uuid,
      name: company.name,
      address: company.address,
      contact_info: {
        email: company.email,
        phone: company.phone || company.mobile,
      },
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.supabase
      .from('clients')
      .upsert(companyData, { onConflict: 'uuid' });

    if (error) {
      throw new Error(`Failed to upsert company: ${error.message}`);
    }
  }

  /**
   * Upsert job data
   */
  private async upsertJob(job: ServiceM8Job): Promise<void> {
    const jobData = {
      uuid: job.uuid,
      company_uuid: job.company_uuid,
      status: job.status,
      description: job.job_description,
      scheduled_date: job.date,
      address: job.job_address,
      quote_sent: job.quote_sent === 1,
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.supabase
      .from('jobs')
      .upsert(jobData, { onConflict: 'uuid' });

    if (error) {
      throw new Error(`Failed to upsert job: ${error.message}`);
    }
  }

  /**
   * Upsert quote data
   */
  private async upsertQuote(job: ServiceM8Job): Promise<void> {
    if (job.status !== 'Quote' || !job.quote_total_amount) {
      return;
    }

    const { data: jobData, error: jobError } = await this.supabase
      .from('jobs')
      .select('id')
      .eq('uuid', job.uuid)
      .single();

    if (jobError || !jobData) {
      throw new Error(`Job not found for quote: ${job.uuid}`);
    }

    const quoteData = {
      job_id: (jobData as { id: number }).id,
      amount: job.quote_total_amount,
      items: [], // Will be populated from attachments or separate API calls
      status: job.quote_approved === 1 ? 'approved' : 'pending',
      approved_at: job.quote_approved_date || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.supabase
      .from('quotes')
      .upsert(quoteData, { onConflict: 'job_id' });

    if (error) {
      throw new Error(`Failed to upsert quote: ${error.message}`);
    }
  }

  /**
   * Sync job activities
   */
  public async syncJobActivities(
    jobUuid: string,
    activities: ServiceM8JobActivity[]
  ): Promise<void> {
    // Get job ID from database
    const { data: jobData, error: jobError } = await this.supabase
      .from('jobs')
      .select('id')
      .eq('uuid', jobUuid)
      .single();

    if (jobError || !jobData) {
      throw new Error(`Job not found for activities: ${jobUuid}`);
    }

    // Store activities in audit_logs for now (can be moved to separate table later)
    for (const activity of activities) {
      const activityData = {
        actor_user_id: 'system',
        action: 'job_activity_sync',
        target_type: 'job',
        target_id: (jobData as { id: number }).id,
        metadata: {
          activity_uuid: activity.uuid,
          start_date: activity.start_date,
          end_date: activity.end_date,
          staff_uuid: activity.staff_uuid,
          activity_type: activity.activity_type,
          notes: activity.notes,
        },
        timestamp: new Date().toISOString(),
      };

      await this.supabase
        .from('audit_logs')
        .insert(activityData);
    }
  }

  /**
   * Sync job attachments
   */
  public async syncJobAttachments(
    jobUuid: string,
    attachments: ServiceM8Attachment[]
  ): Promise<void> {
    // Get job ID from database
    const { data: jobData, error: jobError } = await this.supabase
      .from('jobs')
      .select('id')
      .eq('uuid', jobUuid)
      .single();

    if (jobError || !jobData) {
      throw new Error(`Job not found for attachments: ${jobUuid}`);
    }

    // Store attachments in audit_logs for now (can be moved to separate table later)
    for (const attachment of attachments) {
      const attachmentData = {
        actor_user_id: 'system',
        action: 'attachment_sync',
        target_type: 'job',
        target_id: (jobData as { id: number }).id,
        metadata: {
          attachment_uuid: attachment.uuid,
          file_name: attachment.file_name,
          file_type: attachment.file_type,
          file_size: attachment.file_size,
          category: attachment.category,
          description: attachment.description,
          download_url: attachment.download_url,
        },
        timestamp: new Date().toISOString(),
      };

      await this.supabase
        .from('audit_logs')
        .insert(attachmentData);
    }
  }

  /**
   * Sync job materials
   */
  private async syncJobMaterials(
    jobUuid: string,
    materials: ServiceM8Material[]
  ): Promise<void> {
    // Get job ID from database
    const { data: jobData, error: jobError } = await this.supabase
      .from('jobs')
      .select('id')
      .eq('uuid', jobUuid)
      .single();

    if (jobError || !jobData) {
      throw new Error(`Job not found for materials: ${jobUuid}`);
    }

    // Store materials in audit_logs for now (can be moved to separate table later)
    for (const material of materials) {
      const materialData = {
        actor_user_id: 'system',
        action: 'material_sync',
        target_type: 'job',
        target_id: (jobData as { id: number }).id,
        metadata: {
          material_uuid: material.uuid,
          name: material.name,
          description: material.description,
          quantity: material.quantity,
          unit_cost: material.unit_cost,
          total_cost: material.total_cost,
          category: material.category,
        },
        timestamp: new Date().toISOString(),
      };

      await this.supabase
        .from('audit_logs')
        .insert(materialData);
    }
  }

  /**
   * Log sync activity
   */
  private async logSyncActivity(
    type: string,
    status: ServiceM8SyncStatus,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const logData = {
      actor_user_id: 'system',
      action: 'sync_completed',
      target_type: type,
      target_id: 'bulk',
      metadata: {
        ...metadata,
        sync_status: status,
      },
      timestamp: new Date().toISOString(),
    };

    await this.supabase
      .from('audit_logs')
      .insert(logData);
  }

  /**
   * Get sync status for a company
   */
  async getSyncStatus(companyUuid: string): Promise<{
    lastSync: string | null;
    totalJobs: number;
    totalQuotes: number;
    lastError: string | null;
  }> {
    // Get last sync activity
    const { data: lastSync } = await this.supabase
      .from('audit_logs')
      .select('timestamp, metadata')
      .eq('action', 'sync_completed')
      .eq('target_type', 'jobs')
      .contains('metadata', { companyUuid })
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // Get job counts
    const { count: jobCount } = await this.supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('company_uuid', companyUuid);

    const { count: quoteCount } = await this.supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('company_uuid', companyUuid)
      .eq('status', 'Quote');

    // Get last error
    const { data: lastError } = await this.supabase
      .from('audit_logs')
      .select('metadata')
      .eq('action', 'sync_completed')
      .eq('target_type', 'jobs')
      .contains('metadata', { companyUuid })
      .not('metadata->sync_status->errors', 'is', null)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    return {
      lastSync: (lastSync as { timestamp?: string })?.timestamp || null,
      totalJobs: jobCount || 0,
      totalQuotes: quoteCount || 0,
      lastError: (((lastError?.metadata as Record<string, unknown>)?.sync_status as Record<string, unknown>)?.errors as string[])?.[0] || null,
    };
  }

  /**
   * Perform full sync for all companies
   */
  async performFullSync(): Promise<{
    companies: ServiceM8SyncStatus;
    jobs: ServiceM8SyncStatus[];
    quotes: ServiceM8SyncStatus[];
  }> {
    // Sync all companies first
    const companiesStatus = await this.syncCompanies();

    // Get all company UUIDs
    const { data: companies } = await this.supabase
      .from('clients')
      .select('uuid');

    if (!companies) {
      throw new Error('No companies found for sync');
    }

    // Sync jobs and quotes for each company
    const jobsStatus: ServiceM8SyncStatus[] = [];
    const quotesStatus: ServiceM8SyncStatus[] = [];

    for (const company of companies) {
      try {
        const companyUuid = (company as { uuid: string }).uuid;
        const jobStatus = await this.syncJobsForCompany(companyUuid, {
          includeActivities: true,
          includeAttachments: true,
          includeMaterials: true,
        });
        jobsStatus.push(jobStatus);

        const quoteStatus = await this.syncQuotesForCompany(companyUuid, {
          includeActivities: true,
          includeAttachments: true,
          includeMaterials: true,
        });
        quotesStatus.push(quoteStatus);
      } catch (error) {
        console.error(`Failed to sync company ${(company as { uuid: string }).uuid}:`, error);
      }
    }

    return {
      companies: companiesStatus,
      jobs: jobsStatus,
      quotes: quotesStatus,
    };
  }
}

// Export singleton instance
export const serviceM8SyncService = new ServiceM8SyncService();
