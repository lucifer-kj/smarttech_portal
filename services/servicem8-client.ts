import {
  ServiceM8ClientConfig,
  ServiceM8ApiResponse,
  ServiceM8ApiError,
  ServiceM8RateLimit,
  ServiceM8CacheEntry,
  ServiceM8Job,
  ServiceM8Company,
  ServiceM8JobActivity,
  ServiceM8Staff,
  ServiceM8Material,
  ServiceM8Attachment,
  ServiceM8ServiceAgreement,
  ServiceM8RecurringJob,
  ServiceM8JobWithDetails,
  ServiceM8RequestOptions,
  ServiceM8JobStatus,
} from '@/types/servicem8';

/**
 * ServiceM8 API Client with enhanced features
 * - Rate limiting and exponential backoff
 * - Response caching
 * - Comprehensive error handling
 * - TypeScript support
 */
export class ServiceM8Client {
  private config: ServiceM8ClientConfig;
  private cache = new Map<string, ServiceM8CacheEntry<unknown>>();
  private rateLimitInfo: ServiceM8RateLimit | null = null;

  constructor(config: Partial<ServiceM8ClientConfig> = {}) {
    this.config = {
      baseUrl: 'https://api.servicem8.com/api_1.0',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      cacheEnabled: true,
      cacheTTL: 300000, // 5 minutes
      rateLimitEnabled: true,
      ...config,
    };
  }

  /**
   * Make authenticated request to ServiceM8 API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    // Check rate limits
    if (this.config.rateLimitEnabled && this.rateLimitInfo) {
      if (this.rateLimitInfo.remaining <= 0) {
        const waitTime = this.rateLimitInfo.reset - Date.now();
        if (waitTime > 0) {
          await this.sleep(waitTime);
        }
      }
    }

    // Check cache first
    let cacheKey: string | null = null;
    if (this.config.cacheEnabled) {
      cacheKey = this.getCacheKey(endpoint, options);
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add authentication
    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    } else if (this.config.oauthToken) {
      headers['Authorization'] = `Bearer ${this.config.oauthToken}`;
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.timeout),
    };

    return await this.retryRequest(async () => {
      const response = await fetch(url, requestOptions);
      
      // Update rate limit info from headers
      this.updateRateLimitInfo(response);
      
      if (!response.ok) {
        const error = await this.parseError(response);
        throw error;
      }

      const data = await response.json();
      
      // Cache successful responses
      if (this.config.cacheEnabled && cacheKey) {
        this.setCache(cacheKey, data);
      }

      return data;
    });
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(
    request: () => Promise<T>,
    attempt = 1
  ): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (this.isRetryableError(error) && attempt < this.config.retryAttempts) {
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
        return this.retryRequest(request, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Network errors, timeouts, rate limits
      return (
        error.name === 'AbortError' ||
        error.message.includes('timeout') ||
        error.message.includes('rate limit') ||
        error.message.includes('network')
      );
    }
    return false;
  }

  /**
   * Parse API error response
   */
  private async parseError(response: Response): Promise<ServiceM8ApiError> {
    let errorData: Record<string, unknown>;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: 'Unknown error occurred' };
    }

    return {
      error: (errorData.error as string) || 'API Error',
      message: (errorData.message as string) || `HTTP ${response.status}: ${response.statusText}`,
      code: response.status,
      details: errorData,
    };
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimitInfo(response: Response): void {
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset) * 1000, // Convert to milliseconds
      };
    }
  }

  /**
   * Cache management
   */
  private getCacheKey(endpoint: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as ServiceM8CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.cacheTTL,
    });
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===== CORE API METHODS =====

  /**
   * Get jobs for a company with enhanced filtering
   */
  async getJobs(
    companyUuid: string,
    options: ServiceM8RequestOptions = {}
  ): Promise<ServiceM8ApiResponse<ServiceM8JobWithDetails>> {
    const query = this.buildJobQuery(companyUuid, options);
    return this.makeRequest<ServiceM8ApiResponse<ServiceM8JobWithDetails>>(
      `/job.json?${query}`
    );
  }

  /**
   * Get quotes for a company (jobs with status='Quote')
   */
  async getQuotes(
    companyUuid: string,
    options: ServiceM8RequestOptions = {}
  ): Promise<ServiceM8ApiResponse<ServiceM8JobWithDetails>> {
    const query = this.buildJobQuery(companyUuid, {
      ...options,
      status: ['Quote'],
    });
    return this.makeRequest<ServiceM8ApiResponse<ServiceM8JobWithDetails>>(
      `/job.json?${query}`
    );
  }

  /**
   * Get all companies/clients
   */
  async getClients(): Promise<ServiceM8ApiResponse<ServiceM8Company>> {
    return this.makeRequest<ServiceM8ApiResponse<ServiceM8Company>>(
      '/company.json'
    );
  }

  /**
   * Get job activities for a specific job
   */
  async getJobActivities(
    jobUuid: string
  ): Promise<ServiceM8ApiResponse<ServiceM8JobActivity>> {
    return this.makeRequest<ServiceM8ApiResponse<ServiceM8JobActivity>>(
      `/jobactivity.json?$filter=job_uuid eq '${jobUuid}'&$expand=staff`
    );
  }

  /**
   * Get staff/technicians
   */
  async getStaff(): Promise<ServiceM8ApiResponse<ServiceM8Staff>> {
    return this.makeRequest<ServiceM8ApiResponse<ServiceM8Staff>>(
      '/staff.json?$filter=is_active eq 1'
    );
  }

  /**
   * Get materials for a job
   */
  async getJobMaterials(
    jobUuid: string
  ): Promise<ServiceM8ApiResponse<ServiceM8Material>> {
    return this.makeRequest<ServiceM8ApiResponse<ServiceM8Material>>(
      `/material.json?$filter=job_uuid eq '${jobUuid}'`
    );
  }

  /**
   * Get attachments for a job
   */
  async getJobAttachments(
    jobUuid: string
  ): Promise<ServiceM8ApiResponse<ServiceM8Attachment>> {
    return this.makeRequest<ServiceM8ApiResponse<ServiceM8Attachment>>(
      `/attachment.json?$filter=job_uuid eq '${jobUuid}'`
    );
  }

  /**
   * Get service agreements for a company
   */
  async getServiceAgreements(
    companyUuid: string
  ): Promise<ServiceM8ApiResponse<ServiceM8ServiceAgreement>> {
    return this.makeRequest<ServiceM8ApiResponse<ServiceM8ServiceAgreement>>(
      `/serviceagreement.json?$filter=company_uuid eq '${companyUuid}'`
    );
  }

  /**
   * Get recurring jobs for a company
   */
  async getRecurringJobs(
    companyUuid: string
  ): Promise<ServiceM8ApiResponse<ServiceM8RecurringJob>> {
    return this.makeRequest<ServiceM8ApiResponse<ServiceM8RecurringJob>>(
      `/recurringjob.json?$filter=company_uuid eq '${companyUuid}'`
    );
  }

  /**
   * Update job status (for quote approval)
   */
  async updateJobStatus(
    jobUuid: string,
    status: ServiceM8JobStatus,
    additionalData: Record<string, unknown> = {}
  ): Promise<ServiceM8Job> {
    const body = {
      status,
      ...additionalData,
    };

    return this.makeRequest<ServiceM8Job>(
      `/job/${jobUuid}.json`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  }

  /**
   * Approve quote
   */
  async approveQuote(
    jobUuid: string,
    approvedLineItems?: string[],
    clientNotes?: string
  ): Promise<ServiceM8Job> {
    return this.updateJobStatus(jobUuid, 'Work Order', {
      quote_approved: 1,
      quote_approved_date: new Date().toISOString(),
      approved_line_items: approvedLineItems,
      client_approval_notes: clientNotes,
    });
  }

  /**
   * Reject quote
   */
  async rejectQuote(
    jobUuid: string,
    reason?: string
  ): Promise<ServiceM8Job> {
    return this.updateJobStatus(jobUuid, 'Quote', {
      quote_approved: 0,
      quote_rejection_reason: reason,
    });
  }

  // ===== QUERY BUILDING UTILITIES =====

  /**
   * Build OData query for jobs
   */
  private buildJobQuery(
    companyUuid: string,
    options: ServiceM8RequestOptions
  ): string {
    const params = new URLSearchParams();

    // Base filter for company
    params.append('$filter', `company_uuid eq '${companyUuid}'`);

    // Status filter
    if (options.status && options.status.length > 0) {
      const statusFilter = options.status
        .map(s => `status eq '${s}'`)
        .join(' or ');
      params.append('$filter', `${params.get('$filter')} and (${statusFilter})`);
    }

    // Date range filter
    if (options.dateRange) {
      const dateFilter = `date ge '${options.dateRange.start}' and date le '${options.dateRange.end}'`;
      params.append('$filter', `${params.get('$filter')} and (${dateFilter})`);
    }

    // Staff assignment filter
    if (options.staffAssigned && options.staffAssigned.length > 0) {
      const staffFilter = options.staffAssigned
        .map(s => `staff_assigned eq '${s}'`)
        .join(' or ');
      params.append('$filter', `${params.get('$filter')} and (${staffFilter})`);
    }

    // Expand related data
    const expandItems: string[] = [];
    if (options.includeActivities) expandItems.push('activities');
    if (options.includeAttachments) expandItems.push('attachments');
    if (options.includeMaterials) expandItems.push('materials');
    if (options.includeStaff) expandItems.push('staff');

    if (expandItems.length > 0) {
      params.append('$expand', expandItems.join(','));
    }

    // Pagination
    if (options.limit) {
      params.append('$top', options.limit.toString());
    }
    if (options.offset) {
      params.append('$skip', options.offset.toString());
    }

    return params.toString();
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/company.json?$top=1');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get API usage statistics
   */
  getApiStats(): {
    rateLimit: ServiceM8RateLimit | null;
    cacheStats: { size: number; keys: string[] };
  } {
    return {
      rateLimit: this.rateLimitInfo,
      cacheStats: this.getCacheStats(),
    };
  }
}

// Export singleton instance
export const serviceM8Client = new ServiceM8Client({
  apiKey: process.env.SERVICEM8_API_KEY,
  oauthToken: process.env.SERVICEM8_OAUTH_TOKEN,
  cacheEnabled: process.env.NODE_ENV === 'production',
  cacheTTL: 300000, // 5 minutes
});
