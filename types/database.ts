// Database types generated from Supabase schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          sm8_uuid: string | null;
          role: "admin" | "client";
          is_banned: boolean;
          first_login_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          sm8_uuid?: string | null;
          role?: "admin" | "client";
          is_banned?: boolean;
          first_login_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          sm8_uuid?: string | null;
          role?: "admin" | "client";
          is_banned?: boolean;
          first_login_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          uuid: string;
          name: string;
          address: string | null;
          contact_info: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          uuid: string;
          name: string;
          address?: string | null;
          contact_info?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          uuid?: string;
          name?: string;
          address?: string | null;
          contact_info?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          uuid: string;
          company_uuid: string;
          status: string;
          description: string | null;
          scheduled_date: string | null;
          address: string | null;
          quote_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          uuid: string;
          company_uuid: string;
          status: string;
          description?: string | null;
          scheduled_date?: string | null;
          address?: string | null;
          quote_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          uuid?: string;
          company_uuid?: string;
          status?: string;
          description?: string | null;
          scheduled_date?: string | null;
          address?: string | null;
          quote_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      quotes: {
        Row: {
          id: string;
          job_id: string;
          amount: number;
          items: Record<string, unknown>[];
          status: "pending" | "approved" | "rejected";
          approved_at: string | null;
          rejected_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          amount: number;
          items: Record<string, unknown>[];
          status?: "pending" | "approved" | "rejected";
          approved_at?: string | null;
          rejected_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          amount?: number;
          items?: Record<string, unknown>[];
          status?: "pending" | "approved" | "rejected";
          approved_at?: string | null;
          rejected_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          job_id: string;
          rating: number;
          comment: string;
          private_feedback: boolean;
          google_review_requested: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          rating: number;
          comment: string;
          private_feedback?: boolean;
          google_review_requested?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          rating?: number;
          comment?: string;
          private_feedback?: boolean;
          google_review_requested?: boolean;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string; // Can be UUID (user) or 'system' (system actions)
          action: string;
          target_type: string;
          target_id: string;
          metadata: Record<string, unknown>;
          timestamp: string;
        };
        Insert: {
          id?: string;
          actor_user_id: string; // Can be UUID (user) or 'system' (system actions)
          action: string;
          target_type: string;
          target_id: string;
          metadata?: Record<string, unknown>;
          timestamp?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string; // Can be UUID (user) or 'system' (system actions)
          action?: string;
          target_type?: string;
          target_id?: string;
          metadata?: Record<string, unknown>;
          timestamp?: string;
        };
      };
      webhook_events: {
        Row: {
          id: string;
          sm8_event_id: string;
          payload: Record<string, unknown>;
          status: "queued" | "processing" | "success" | "failed";
          processed_at: string | null;
          error_details: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sm8_event_id: string;
          payload: Record<string, unknown>;
          status?: "queued" | "processing" | "success" | "failed";
          processed_at?: string | null;
          error_details?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sm8_event_id?: string;
          payload?: Record<string, unknown>;
          status?: "queued" | "processing" | "success" | "failed";
          processed_at?: string | null;
          error_details?: string | null;
          created_at?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          keys: Record<string, unknown>;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          keys: Record<string, unknown>;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          keys?: Record<string, unknown>;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      reconciliation_logs: {
        Row: {
          id: string;
          type: "full" | "incremental" | "emergency";
          status: "running" | "completed" | "failed";
          started_at: string;
          completed_at: string | null;
          records_processed: number;
          errors: number;
          duration: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          type: "full" | "incremental" | "emergency";
          status?: "running" | "completed" | "failed";
          started_at: string;
          completed_at?: string | null;
          records_processed?: number;
          errors?: number;
          duration?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: "full" | "incremental" | "emergency";
          status?: "running" | "completed" | "failed";
          started_at?: string;
          completed_at?: string | null;
          records_processed?: number;
          errors?: number;
          duration?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      system_alerts: {
        Row: {
          id: string;
          type: "error" | "warning" | "info";
          title: string;
          message: string;
          resolved: boolean;
          resolved_at: string | null;
          resolved_by: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: "error" | "warning" | "info";
          title: string;
          message: string;
          resolved?: boolean;
          resolved_at?: string | null;
          resolved_by?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: "error" | "warning" | "info";
          title?: string;
          message?: string;
          resolved?: boolean;
          resolved_at?: string | null;
          resolved_by?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          job_id: string | null;
          quote_id: string | null;
          user_id: string;
          title: string;
          description: string | null;
          file_path: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          category: "quote" | "invoice" | "warranty" | "certificate" | "photo" | "other";
          is_public: boolean;
          requires_signature: boolean;
          signed_at: string | null;
          signed_by: string | null;
          version: number;
          parent_document_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id?: string | null;
          quote_id?: string | null;
          user_id: string;
          title: string;
          description?: string | null;
          file_path: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          category: "quote" | "invoice" | "warranty" | "certificate" | "photo" | "other";
          is_public?: boolean;
          requires_signature?: boolean;
          signed_at?: string | null;
          signed_by?: string | null;
          version?: number;
          parent_document_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string | null;
          quote_id?: string | null;
          user_id?: string;
          title?: string;
          description?: string | null;
          file_path?: string;
          file_name?: string;
          file_size?: number;
          mime_type?: string;
          category?: "quote" | "invoice" | "warranty" | "certificate" | "photo" | "other";
          is_public?: boolean;
          requires_signature?: boolean;
          signed_at?: string | null;
          signed_by?: string | null;
          version?: number;
          parent_document_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_access_logs: {
        Row: {
          id: string;
          document_id: string;
          user_id: string;
          action: "view" | "download" | "sign" | "delete";
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          user_id: string;
          action: "view" | "download" | "sign" | "delete";
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          user_id?: string;
          action?: "view" | "download" | "sign" | "delete";
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      document_signatures: {
        Row: {
          id: string;
          document_id: string;
          user_id: string;
          signature_data: string;
          signature_type: "electronic" | "digital";
          signed_at: string;
          ip_address: string | null;
          metadata: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          document_id: string;
          user_id: string;
          signature_data: string;
          signature_type: "electronic" | "digital";
          signed_at?: string;
          ip_address?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: {
          id?: string;
          document_id?: string;
          user_id?: string;
          signature_data?: string;
          signature_type?: "electronic" | "digital";
          signed_at?: string;
          ip_address?: string | null;
          metadata?: Record<string, unknown>;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      log_audit_event: {
        Args: {
          p_action: string;
          p_target_type: string;
          p_target_id: string;
          p_metadata?: Record<string, unknown>;
        };
        Returns: string;
      };
      sync_sm8_client: {
        Args: {
          p_uuid: string;
          p_name: string;
          p_address?: string | null;
          p_contact_info?: Record<string, unknown>;
        };
        Returns: string;
      };
      sync_sm8_job: {
        Args: {
          p_uuid: string;
          p_company_uuid: string;
          p_status: string;
          p_description?: string | null;
          p_scheduled_date?: string | null;
          p_address?: string | null;
          p_quote_sent?: boolean;
        };
        Returns: string;
      };
      approve_quote: {
        Args: {
          p_quote_id: string;
          p_approved: boolean;
          p_reason?: string | null;
        };
        Returns: boolean;
      };
      submit_feedback: {
        Args: {
          p_job_id: string;
          p_rating: number;
          p_comment: string;
          p_private_feedback?: boolean;
        };
        Returns: string;
      };
      get_user_jobs: {
        Args: {
          p_limit?: number;
          p_offset?: number;
          p_status?: string | null;
        };
        Returns: {
          id: string;
          uuid: string;
          status: string;
          description: string | null;
          scheduled_date: string | null;
          address: string | null;
          quote_sent: boolean;
          created_at: string;
          updated_at: string;
        }[];
      };
      get_user_quotes: {
        Args: {
          p_limit?: number;
          p_offset?: number;
          p_status?: string | null;
        };
        Returns: {
          id: string;
          job_id: string;
          amount: number;
          items: Record<string, unknown>[];
          status: string;
          approved_at: string | null;
          rejected_at: string | null;
          created_at: string;
          updated_at: string;
        }[];
      };
      log_document_access: {
        Args: {
          p_document_id: string;
          p_user_id: string;
          p_action: string;
          p_ip_address?: string | null;
          p_user_agent?: string | null;
        };
        Returns: undefined;
      };
      get_user_documents: {
        Args: {
          p_user_id: string;
          p_job_id?: string | null;
          p_category?: string | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          job_id: string | null;
          quote_id: string | null;
          title: string;
          description: string | null;
          file_name: string;
          file_size: number;
          mime_type: string;
          category: string;
          is_public: boolean;
          requires_signature: boolean;
          signed_at: string | null;
          version: number;
          created_at: string;
          updated_at: string;
        }[];
      };
      create_document_version: {
        Args: {
          p_parent_document_id: string;
          p_file_path: string;
          p_file_name: string;
          p_file_size: number;
          p_mime_type: string;
          p_user_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
