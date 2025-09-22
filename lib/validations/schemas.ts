import { z } from "zod";

// User validation schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  sm8_uuid: z.string().uuid().nullable(),
  role: z.enum(["admin", "client"]),
  is_banned: z.boolean(),
  first_login_complete: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  sm8_uuid: z.string().uuid("Invalid ServiceM8 UUID"),
  role: z.enum(["admin", "client"]).default("client"),
});

// Authentication schemas
export const magicLinkRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Job and Quote schemas
export const jobSchema = z.object({
  id: z.string().uuid(),
  uuid: z.string().uuid(),
  company_uuid: z.string().uuid(),
  status: z.string(),
  description: z.string(),
  scheduled_date: z.string().datetime().nullable(),
  address: z.string(),
  quote_sent: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const quoteItemSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit_price: z.number().positive("Unit price must be positive"),
  total: z.number().positive("Total must be positive"),
});

export const quoteSchema = z.object({
  id: z.string().uuid(),
  job_id: z.string().uuid(),
  amount: z.number().positive("Amount must be positive"),
  items: z.array(quoteItemSchema),
  status: z.enum(["pending", "approved", "rejected"]),
  approved_at: z.string().datetime().nullable(),
  rejected_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Feedback schemas
export const feedbackSubmissionSchema = z.object({
  job_id: z.string().uuid("Invalid job ID"),
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z
    .string()
    .min(1, "Comment is required")
    .max(1000, "Comment is too long"),
});

export const feedbackSchema = z.object({
  id: z.string().uuid(),
  job_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string(),
  private_feedback: z.boolean(),
  google_review_requested: z.boolean(),
  created_at: z.string().datetime(),
});

// Quote approval schema
export const quoteApprovalSchema = z.object({
  quote_id: z.string().uuid("Invalid quote ID"),
  approved: z.boolean(),
  reason: z.string().optional(),
});

// Webhook schemas
export const webhookEventSchema = z.object({
  object_type: z.string(),
  object_uuid: z.string().uuid(),
  timestamp: z.string().datetime(),
  changes: z.record(z.string(), z.any()),
});

// Push notification schemas
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url("Invalid endpoint URL"),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// API response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const paginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.unknown()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Export types
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type MagicLinkRequest = z.infer<typeof magicLinkRequestSchema>;
export type PasswordChange = z.infer<typeof passwordChangeSchema>;
export type Job = z.infer<typeof jobSchema>;
export type QuoteItem = z.infer<typeof quoteItemSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type FeedbackSubmission = z.infer<typeof feedbackSubmissionSchema>;
export type Feedback = z.infer<typeof feedbackSchema>;
export type QuoteApproval = z.infer<typeof quoteApprovalSchema>;
export type WebhookEvent = z.infer<typeof webhookEventSchema>;
export type PushSubscription = z.infer<typeof pushSubscriptionSchema>;
export type ApiResponse<T = unknown> = z.infer<typeof apiResponseSchema> & {
  data?: T;
};
export type PaginatedResponse<T = unknown> = z.infer<
  typeof paginatedResponseSchema
> & { data: T[] };
