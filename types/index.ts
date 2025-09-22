// User types
export interface User {
  id: string;
  email: string;
  sm8_uuid: string | null;
  role: "admin" | "client";
  is_banned: boolean;
  first_login_complete: boolean;
  created_at: string;
  updated_at: string;
}

// ServiceM8 related types
export interface ServiceM8Client {
  uuid: string;
  name: string;
  address: string;
  email: string;
  phone: string;
}

export interface ServiceM8Job {
  uuid: string;
  company_uuid: string;
  status: string;
  job_address: string;
  job_description: string;
  date: string;
  quote_sent: number;
  generated_job_id?: string;
  quote_date?: string;
}

export interface ServiceM8JobActivity {
  uuid: string;
  job_uuid: string;
  start_date: string;
  end_date: string;
  staff_uuid: string;
  activity_was_scheduled: number;
}

// Portal database types
export interface Client {
  id: string;
  uuid: string; // ServiceM8 UUID
  name: string;
  address: string;
  contact_info: {
    email?: string;
    phone?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  uuid: string; // ServiceM8 UUID
  company_uuid: string;
  status: string;
  description: string;
  scheduled_date: string | null;
  address: string;
  quote_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  job_id: string;
  amount: number;
  items: QuoteItem[];
  status: "pending" | "approved" | "rejected";
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Feedback {
  id: string;
  job_id: string;
  rating: number;
  comment: string;
  private_feedback: boolean;
  google_review_requested: boolean;
  created_at: string;
}

// Audit and logging types
export interface AuditLog {
  id: string;
  actor_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface WebhookEvent {
  id: string;
  sm8_event_id: string;
  payload: Record<string, unknown>;
  status: "queued" | "processing" | "success" | "failed";
  processed_at: string | null;
  error_details: string | null;
  created_at: string;
}

// Push notification types
export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface MagicLinkRequest {
  email: string;
}

export interface PasswordChangeRequest {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

export interface FeedbackSubmission {
  job_id: string;
  rating: number;
  comment: string;
}

export interface QuoteApproval {
  quote_id: string;
  approved: boolean;
  reason?: string;
}

// Re-export ServiceM8 types
export * from './servicem8';
