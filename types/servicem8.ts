// ServiceM8 API Types - Enhanced based on technical reference

// Base ServiceM8 API Response
export interface ServiceM8ApiResponse<T> {
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
  };
}

// Company/Client Types
export interface ServiceM8Company {
  uuid: string;
  name: string;
  address: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  notes?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// Job Types
export interface ServiceM8Job {
  uuid: string;
  company_uuid: string;
  status: ServiceM8JobStatus;
  job_address: string;
  job_description: string;
  date: string; // ISO datetime
  quote_sent: number; // 0 or 1
  job_is_quoted: number; // 0 or 1
  generated_job_id?: string;
  quote_date?: string;
  quote_total_amount?: number;
  quote_approval_url?: string;
  quote_approved?: number; // 0 or 1
  quote_approved_date?: string;
  staff_assigned?: string; // staff UUID
  job_priority?: 'Low' | 'Medium' | 'High' | 'Emergency';
  customer_rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ServiceM8JobStatus = 
  | 'Quote'
  | 'Work Order'
  | 'Scheduled'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Emergency'
  | 'On Hold';

// Job Activity Types
export interface ServiceM8JobActivity {
  uuid: string;
  job_uuid: string;
  start_date: string; // ISO datetime
  end_date: string; // ISO datetime
  staff_uuid: string;
  activity_was_scheduled: number; // 0 or 1
  activity_type: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Staff/Technician Types
export interface ServiceM8Staff {
  uuid: string;
  name: string;
  mobile?: string;
  email?: string;
  is_active: number; // 0 or 1
  staff_type?: string;
  skills?: string[];
  created_at: string;
  updated_at: string;
}

// Material/Parts Types
export interface ServiceM8Material {
  uuid: string;
  job_uuid: string;
  name: string;
  description?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  category?: string;
  created_at: string;
  updated_at: string;
}

// Attachment/Document Types
export interface ServiceM8Attachment {
  uuid: string;
  job_uuid: string;
  file_name: string;
  file_type: string;
  file_size: number;
  category?: ServiceM8AttachmentCategory;
  description?: string;
  uploaded_by?: string; // staff UUID
  upload_date: string;
  download_url?: string;
  created_at: string;
  updated_at: string;
}

export type ServiceM8AttachmentCategory = 
  | 'quotes'
  | 'invoices'
  | 'certificates'
  | 'photos'
  | 'warranties'
  | 'Progress Photos'
  | 'Before Photos'
  | 'After Photos'
  | 'Documentation';

// Quote Line Item Types
export interface ServiceM8QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  category?: 'Labor' | 'Materials' | 'Additional';
}

// Service Agreement Types
export interface ServiceM8ServiceAgreement {
  uuid: string;
  company_uuid: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// Recurring Job Types
export interface ServiceM8RecurringJob {
  uuid: string;
  company_uuid: string;
  name: string;
  description?: string;
  frequency: string;
  next_due_date: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// Webhook Types
export interface ServiceM8WebhookPayload {
  object_type: 'Job' | 'Company' | 'JobActivity' | 'Attachment' | 'Staff';
  object_uuid: string;
  timestamp: string;
  event_type: 'created' | 'updated' | 'deleted' | 'status_changed' | 'attachment_added';
  changes?: Record<string, unknown>;
  related_objects?: {
    staff_assigned?: string;
    materials_updated?: boolean;
    activities_modified?: boolean;
    attachments_added?: string[];
    activities_added?: string[];
  };
}

// API Request Options
export interface ServiceM8RequestOptions {
  includeActivities?: boolean;
  includeAttachments?: boolean;
  includeMaterials?: boolean;
  includeStaff?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  status?: ServiceM8JobStatus[];
  priority?: string[];
  staffAssigned?: string[];
  limit?: number;
  offset?: number;
}

// API Error Types
export interface ServiceM8ApiError {
  error: string;
  message: string;
  code?: number;
  details?: Record<string, unknown>;
}

// Rate Limiting Types
export interface ServiceM8RateLimit {
  limit: number;
  remaining: number;
  reset: number;
}

// Cache Types
export interface ServiceM8CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Sync Status Types
export interface ServiceM8SyncStatus {
  lastSync: string;
  totalRecords: number;
  syncedRecords: number;
  failedRecords: number;
  errors: string[];
}

// Enhanced Job with Related Data
export interface ServiceM8JobWithDetails extends ServiceM8Job {
  activities?: ServiceM8JobActivity[];
  attachments?: ServiceM8Attachment[];
  materials?: ServiceM8Material[];
  staff?: ServiceM8Staff;
  company?: ServiceM8Company;
  quote_line_items?: ServiceM8QuoteLineItem[];
}

// Enhanced Company with Related Data
export interface ServiceM8CompanyWithDetails extends ServiceM8Company {
  jobs?: ServiceM8Job[];
  service_agreements?: ServiceM8ServiceAgreement[];
  recurring_jobs?: ServiceM8RecurringJob[];
}

// API Client Configuration
export interface ServiceM8ClientConfig {
  apiKey?: string;
  oauthToken?: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  rateLimitEnabled: boolean;
}

// Query Builder Types
export interface ServiceM8QueryBuilder {
  filter(field: string, operator: string, value: unknown): ServiceM8QueryBuilder;
  expand(relations: string[]): ServiceM8QueryBuilder;
  orderBy(field: string, direction: 'asc' | 'desc'): ServiceM8QueryBuilder;
  limit(count: number): ServiceM8QueryBuilder;
  offset(count: number): ServiceM8QueryBuilder;
  build(): string;
}

// All types are already exported above with their declarations
// No need for duplicate exports
