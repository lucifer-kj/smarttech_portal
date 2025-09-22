# Enhanced API Connections, Hooks, and Services

> Status & Alignment (Sep 2025)
> - Implemented: Auth APIs/hooks, Admin portal APIs, Client portal core (jobs/quotes/docs/feedback), Webhooks, Realtime, Push basics
> - Planned/In Progress: Reconciliation cron (Phase 10), Advanced analytics endpoints, Maintenance & Emergency full suite, Mobile integrations

## 1. 🔑 Authentication & Security

### API Routes
* `POST /api/auth/magic-link` → request Magic Link from Supabase.
* `POST /api/auth/password/change` → change user password (Supabase API wrapper).
* `GET /api/auth/session` → get current user session (with `sm8_uuid` claim).

### Hooks
* `useAuth()` → Zustand + Supabase session state, user info, role.
* `useFirstLoginWalkthrough()` → checks `first_login_complete` in Supabase and triggers walkthrough modal.

### Services
* **Supabase Auth SDK** → Magic Link + Password Auth.
* **RLS Policies** → enforce row-level access + `is_banned=false`.

Status: Implemented ✅

---

## 2. 🖥️ Admin Portal

### API Routes
* `POST /api/admin/users` → create new user mapped to SM8 UUID.
* `POST /api/admin/magic-link` → generate Magic Link for existing client.
* `GET /api/admin/users` → list all users (filter by banned/unbanned).
* `POST /api/admin/users/:id/ban` → ban user.
* `POST /api/admin/users/:id/unban` → unban user.
* `GET /api/admin/logs` → fetch system logs (audit + webhook).
* `GET /api/admin/analytics` → fetch service trends and client analytics.
* `GET /api/admin/maintenance` → fetch maintenance contracts and schedules.

### Hooks
* `useUsers()` → fetch + manage user list for admin dashboard.
* `useLogs()` → stream audit/webhook logs.
* `useAnalytics()` → fetch dashboard analytics and reporting data.
* `useMaintenanceContracts()` → manage maintenance schedules and contracts.

### Services
* **User Service** → wrappers for create, ban/unban, magic link generation.
* **Log Service** → fetch + filter logs from `audit_logs` and `webhook_events`.
* **Analytics Service** → generate reports and dashboard metrics.
* **Maintenance Service** → handle preventive maintenance and service contracts.

Status: Implemented core users/logs; analytics/maintenance partial 🚧

---

## 3. 👤 Enhanced Client Portal

### API Routes
* `GET /api/client/jobs` → list jobs for client (`sm8_uuid`).
* `GET /api/client/jobs/:id` → job details + documents + activities.
* `GET /api/client/jobs/:id/activities` → detailed job activities and technician updates.
* `GET /api/client/jobs/:id/photos` → job progress photos from technicians.
* `POST /api/client/jobs/:id/reschedule` → request appointment rescheduling.
* `GET /api/client/quotes/:id` → fetch quote with line item breakdown.
* `POST /api/client/quotes/:id/approve` → approve quote (full or partial).
* `POST /api/client/quotes/:id/reject` → reject quote with optional reason.
* `GET /api/client/quotes/compare` → compare multiple quotes for same job.
* `POST /api/client/feedback` → submit feedback with photo attachments.
* `POST /api/client/account/password` → set/change password.
* `GET /api/client/documents` → organized documents by category.
* `GET /api/client/documents/:id/download` → secure document download.
* `POST /api/client/emergency` → emergency service request.
* `GET /api/client/maintenance` → preventive maintenance schedule.
* `GET /api/client/analytics` → personal service analytics and trends.

### Hooks
* `useJobs()` → subscribe to jobs via Supabase Realtime + fetch fallback.
* `useJobActivities(jobId)` → real-time job activities and technician updates.
* `useQuotes()` → fetch + approve/reject quotes with line item details.
* `useQuoteComparison()` → compare multiple quotes functionality.
* `useFeedback()` → submit rating/comments with photo attachments.
* `useWalkthrough()` → manage walkthrough state.
* `useDocuments()` → organized document management with categories.
* `useEmergencyService()` → emergency request handling.
* `useMaintenanceSchedule()` → preventive maintenance alerts and scheduling.
* `useClientAnalytics()` → personal service trends and cost analysis.

### Services
* **Job Service** → wrapper around `/api/client/jobs` with enhanced features.
* **Job Activity Service** → real-time technician updates and progress tracking.
* **Quote Service** → enhanced approve/reject with line item and comparison features.
* **Feedback Service** → enhanced feedback with photo attachments and private handling.
* **Document Service** → categorized document management with bulk operations.
* **Emergency Service** → 24/7 emergency request handling.
* **Maintenance Service** → preventive maintenance and equipment tracking.
* **Analytics Service** → client-specific reporting and trend analysis.

Status: Jobs/Quotes/Documents/Feedback implemented ✅; Emergency/Maintenance/Advanced Analytics pending 🚧

---

## 4. 📋 Enhanced ServiceM8 Integration

### API Routes
* `GET /api/sm8/jobs/:company_uuid` → enhanced job sync with activities.
* `GET /api/sm8/quotes/:company_uuid` → quote sync with line item details.
* `GET /api/sm8/activities/:job_uuid` → detailed job activities and scheduling.
* `GET /api/sm8/staff/:staff_uuid` → technician information and availability.
* `GET /api/sm8/materials/:job_uuid` → materials and parts used in jobs.
* `POST /api/sm8/jobs/:job_uuid/status` → update job status for quote approval.
* `GET /api/sm8/attachments/:job_uuid` → job photos and documents.

### Hooks
* `useSM8Sync()` → comprehensive ServiceM8 data synchronization.
* `useTechnicianTracking()` → real-time technician location and status.
* `useJobMaterials()` → materials and parts tracking for jobs.
* `useSM8Photos()` → real-time photo updates from field technicians.

### Services
* **Enhanced SM8 API Service** → comprehensive ServiceM8 integration with all endpoints.
* **Technician Service** → track technician assignments, location, and availability.
* **Materials Service** → sync materials and parts data from ServiceM8.
* **Photo Service** → handle real-time photo updates and organization.

Status: Core SM8 client/sync implemented ✅; materials/staff/photos advanced features partially implemented 🚧

---

## 5. ⚡ Enhanced Realtime & Push Notifications

### API Routes
* `POST /api/notifications/subscribe` → register client push subscription.
* `POST /api/notifications/send` → send push notification with rich content.
* `POST /api/notifications/emergency` → emergency notification system.
* `GET /api/notifications/history` → notification history and preferences.

### Hooks
* `useRealtimeJobs(sm8_uuid)` → subscribe to `jobs` table changes with activities.
* `useRealtimeQuotes(sm8_uuid)` → subscribe to `quotes` table changes.
* `useRealtimeTechnician(jobId)` → real-time technician location and updates.
* `usePushNotifications()` → enhanced notification management with rich content.
* `useEmergencyAlerts()` → emergency notification handling.

### Services
* **Enhanced Realtime Service** → comprehensive real-time updates for all entities.
* **Enhanced Push Notification Service** → rich notifications with actionable buttons.
* **Emergency Alert Service** → priority notification system for urgent situations.
* **Notification History Service** → manage notification preferences and history.

Status: Realtime jobs/quotes implemented ✅; advanced technician tracking and rich push actions partial 🚧

---

## 6. 📊 Enhanced Analytics & Reporting

### API Routes
* `GET /api/analytics/client/:sm8_uuid` → client-specific analytics and trends.
* `GET /api/analytics/admin/overview` → admin dashboard analytics.
* `GET /api/analytics/satisfaction` → feedback and satisfaction metrics.
* `GET /api/analytics/maintenance` → maintenance contract and schedule analytics.
* `GET /api/analytics/emergency` → emergency response time analytics.

### Hooks
* `useClientAnalytics()` → client service trends and cost analysis.
* `useAdminAnalytics()` → comprehensive admin dashboard metrics.
* `useSatisfactionMetrics()` → feedback trends and satisfaction scores.
* `useMaintenanceAnalytics()` → maintenance contract performance and scheduling.

### Services
* **Client Analytics Service** → personal service history and trend analysis.
* **Admin Analytics Service** → business intelligence and performance metrics.
* **Satisfaction Service** → feedback analysis and satisfaction tracking.
* **Maintenance Analytics Service** → preventive maintenance effectiveness tracking.

Status: Planned; initial admin stats present, full analytics pending 🚧

---

## 7. 🔧 Maintenance & Service Contracts

### API Routes
* `GET /api/maintenance/contracts/:sm8_uuid` → client maintenance contracts.
* `GET /api/maintenance/schedule/:sm8_uuid` → upcoming maintenance schedule.
* `POST /api/maintenance/request` → request maintenance service.
* `GET /api/maintenance/history/:equipment_id` → equipment service history.
* `GET /api/maintenance/equipment/:sm8_uuid` → equipment registry with warranties.

### Hooks
* `useMaintenanceContracts()` → manage maintenance contracts and renewals.
* `useMaintenanceSchedule()` → upcoming maintenance alerts and scheduling.
* `useEquipmentRegistry()` → track installed equipment and warranties.
* `useServiceHistory()` → complete maintenance history for equipment.

### Services
* **Maintenance Contract Service** → digital contract management and renewal.
* **Equipment Service** → equipment registry with warranty and service tracking.
* **Preventive Maintenance Service** → automated scheduling and reminders.
* **Service History Service** → comprehensive maintenance record keeping.

Status: Planned 🚧

---

## 8. 🚨 Emergency & Priority Services

### API Routes
* `POST /api/emergency/request` → 24/7 emergency service request.
* `GET /api/emergency/status/:request_id` → real-time emergency response status.
* `POST /api/emergency/escalate` → escalate emergency request.
* `GET /api/emergency/contacts/:sm8_uuid` → emergency contact tree.

### Hooks
* `useEmergencyRequest()` → emergency service request handling.
* `useEmergencyStatus()` → real-time emergency response tracking.
* `useEmergencyContacts()` → manage emergency contact information.

### Services
* **Emergency Request Service** → 24/7 emergency service coordination.
* **Emergency Response Service** → real-time status and escalation handling.
* **Emergency Contact Service** → manage multiple contact methods and escalation.

Status: Planned 🚧

---

## 9. 📱 Mobile & Integration Features

### API Routes
* `POST /api/integrations/calendar/sync` → sync appointments with external calendars.
* `GET /api/integrations/weather` → weather correlation for service patterns.
* `POST /api/mobile/photo/upload` → mobile photo capture and upload.
* `GET /api/mobile/location/services` → location-based service requests.

### Hooks
* `useCalendarSync()` → external calendar integration.
* `useWeatherIntegration()` → weather-based service correlation.
* `useMobileCamera()` → camera integration for photo capture.
* `useLocationServices()` → GPS-based features and location tracking.

### Services
* **Calendar Integration Service** → sync with Google/Outlook calendars.
* **Weather Service** → correlate weather patterns with service needs.
* **Mobile Camera Service** → photo capture and organization.
* **Location Service** → GPS-based service requests and tracking.

Status: Planned 🚧

---

# 🗂️ Enhanced Summary Map

### APIs
* `/api/auth/*` → login, session, password
* `/api/admin/*` → users, magic links, ban/unban, logs, analytics, maintenance
* `/api/client/*` → jobs, quotes, feedback, account, documents, emergency, maintenance, analytics
* `/api/webhooks/sm8` → SM8 integration
* `/api/notifications/*` → push subscriptions, emergency alerts
* `/api/sm8/*` → enhanced ServiceM8 integration
* `/api/analytics/*` → reporting and business intelligence
* `/api/maintenance/*` → service contracts and equipment management
* `/api/emergency/*` → emergency service coordination
* `/api/integrations/*` → third-party integrations
* `/api/mobile/*` → mobile-specific features

### Enhanced Hooks
* Core: `useAuth`, `useJobs`, `useQuotes`, `useFeedback`, `useWalkthrough`
* Admin: `useUsers`, `useLogs`, `useAnalytics`, `useMaintenanceContracts`
* Client Enhanced: `useJobActivities`, `useQuoteComparison`, `useDocuments`, `useEmergencyService`, `useMaintenanceSchedule`, `useClientAnalytics`
* Real-time: `useRealtimeJobs`, `useRealtimeQuotes`, `useRealtimeTechnician`, `usePushNotifications`, `useEmergencyAlerts`
* Integration: `useCalendarSync`, `useWeatherIntegration`, `useMobileCamera`, `useLocationServices`

### Enhanced Services
* **Auth Service** (Supabase)
* **User Service** (admin control)
* **Enhanced Job/Quote Service** (with activities, materials, technician tracking)
* **Enhanced Feedback Service** (with photos and analytics)
* **Enhanced SM8 API Service** + **Webhook Processor**
* **Enhanced Realtime Service** (comprehensive real-time updates)
* **Enhanced Push Notification Service** (rich notifications)
* **Audit/Log Service**
* **Analytics Service** (client and admin)
* **Maintenance Service** (contracts, equipment, preventive care)
* **Emergency Service** (24/7 coordination)
* **Integration Service** (calendar, weather, mobile)

---