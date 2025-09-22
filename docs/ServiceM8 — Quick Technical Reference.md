# Enhanced ServiceM8 Technical Reference (for SmartTech Portal)

## Auth & General Notes

* **Private apps (single-account integrations):** use an **API Key** (generated in the ServiceM8 account). **Public apps** use **OAuth2**. Ensure your server-side code never exposes API keys to the browser.
* **Base URL:** `https://api.servicem8.com/api_1.0/` (JSON endpoints end with `.json`).
* **Throttling / scopes:** endpoints require specific scopes (e.g. `read_jobs`, `manage_schedule`, `read_attachments`). Respect rate limits (20,000 requests/day) and implement exponential backoff.

---

## 1) Enhanced getJobs(company_uuid | sm8_uuid)

**Purpose:** list jobs with enhanced filtering and detailed information.

* **Endpoint:** `GET /api_1.0/job.json`
* **Auth:** API Key (private) or OAuth token (server-side).
* **Enhanced Querying:** use OData-style `$filter` with multiple conditions and `$expand` for related data.
* **Example request (HTTP):**

```
GET https://api.servicem8.com/api_1.0/job.json?$filter=company_uuid eq '{company_uuid}'&$expand=activities,attachments&$top=100
Authorization: Bearer <OAUTH_TOKEN>  // or X-API-Key: <API_KEY>
Accept: application/json
```

* **Enhanced response item:**

```json
{
  "uuid": "123e4567-0bd8-4b31-933e-23437b9fdcbb",
  "company_uuid": "comp-uuid-abc",
  "status": "Quote",
  "job_address": "123 Street",
  "job_description": "Fix conduit",
  "date": "2025-09-01 12:00:00",
  "quote_sent": 1,
  "job_is_quoted": 1,
  "generated_job_id": "12345",
  "activities": [...],
  "attachments": [...],
  "materials_used": [...],
  "staff_assigned": "staff-uuid-123"
}
```

* **Implementation:** Enhanced filtering for job status, date ranges, and staff assignments. Include related activities and attachments in single API call.

---

## 2) Enhanced getJobActivities(job_uuid)

**Purpose:** Detailed job activities, scheduling, and technician updates.

* **Endpoint:** `GET /api_1.0/jobactivity.json?$filter=job_uuid eq '{job_uuid}'&$expand=staff`
* **Enhanced Response:**

```json
{
  "uuid": "activity-uuid",
  "job_uuid": "job-uuid",
  "start_date": "2025-10-11 12:30:00",
  "end_date": "2025-10-11 15:30:00",
  "staff_uuid": "staff-uuid",
  "activity_was_scheduled": 1,
  "activity_type": "Scheduled Work",
  "notes": "Initial site inspection completed",
  "staff": {
    "uuid": "staff-uuid",
    "name": "John Smith",
    "mobile": "0123456789",
    "email": "john@smarttech.com"
  }
}
```

* **Implementation:** Use for detailed timeline views, technician tracking, and ETA calculations.

---

## 3) Enhanced getQuotes(sm8_uuid) with Line Items

**Purpose:** Detailed quote information with line item breakdown.

* **Endpoint:** `GET /api_1.0/job.json?$filter=company_uuid eq '{company_uuid}' AND status eq 'Quote'&$expand=attachments`
* **Enhanced filtering for quote details:**

```
GET /api_1.0/job.json?$filter=company_uuid eq '{company_uuid}' AND job_is_quoted eq 1&$expand=attachments,materials
```

* **Line Item Data:** Quote line items may be stored in attachments or separate quote objects. Check for:
  - `quote_total_amount`
  - `quote_line_items` (if available)
  - Attachment PDFs containing itemized quotes

---

## 4) Staff and Technician Information

**Purpose:** Get technician details for job assignments and tracking.

* **Endpoint:** `GET /api_1.0/staff.json`
* **Filtering:** `GET /api_1.0/staff.json?$filter=is_active eq 1`
* **Response:**

```json
{
  "uuid": "staff-uuid-123",
  "name": "John Smith",
  "mobile": "0123456789",
  "email": "john@smarttech.com",
  "is_active": 1,
  "staff_type": "Technician",
  "skills": ["Electrical", "HVAC"]
}
```

* **Implementation:** Use for technician assignment displays and contact information.

---

## 5) Materials and Parts Tracking

**Purpose:** Track materials and parts used in jobs.

* **Endpoint:** `GET /api_1.0/material.json?$filter=job_uuid eq '{job_uuid}'`
* **Response:**

```json
{
  "uuid": "material-uuid",
  "job_uuid": "job-uuid",
  "name": "15A Circuit Breaker",
  "description": "Square D QO115 Circuit Breaker",
  "quantity": 2,
  "unit_cost": 25.50,
  "total_cost": 51.00,
  "category": "Electrical Components"
}
```

* **Implementation:** Show clients exactly what materials were used and their costs.

---

## 6) Enhanced Attachment Management

**Purpose:** Comprehensive document and photo management.

* **Endpoint:** `GET /api_1.0/attachment.json?$filter=job_uuid eq '{job_uuid}'`
* **Enhanced Response:**

```json
{
  "uuid": "attachment-uuid",
  "job_uuid": "job-uuid",
  "file_name": "before_photo.jpg",
  "file_type": "image/jpeg",
  "file_size": 1024000,
  "category": "Progress Photos",
  "description": "Before repair photo - kitchen outlet",
  "uploaded_by": "staff-uuid",
  "upload_date": "2025-09-01T10:30:00Z",
  "download_url": "https://api.servicem8.com/api_1.0/attachment/uuid/download"
}
```

* **Categories:** Organize by type:
  - `quotes` - Quote documents and proposals
  - `invoices` - Final billing documents
  - `certificates` - Compliance certificates and warranties
  - `photos` - Progress and completion photos
  - `warranties` - Warranty documentation

---

## 7) Enhanced approveQuote Implementation

**Multiple Approaches for Quote Approval:**

**A - ServiceM8 Native Approval Link (Recommended):**
* Check if job contains `quote_approval_url` field
* Redirect client to ServiceM8's native approval system
* Monitor webhook for approval status changes

**B - API Status Update with Line Item Support:**
* **Endpoint:** `POST /api_1.0/job/{uuid}.json`
* **Enhanced Body:**

```json
{
  "status": "Work Order",
  "quote_approved": true,
  "quote_approved_date": "2025-09-01T15:30:00Z",
  "approved_line_items": ["item1", "item2"],
  "client_approval_notes": "Approved all electrical work items"
}
```

**C - Partial Quote Approval:**
* Allow clients to approve specific line items
* Update job with partial approval status
* Generate revised quotes for remaining items

---

## 8) Advanced Webhook Processing

**Enhanced Webhook Payload:**

```json
{
  "object_type": "Job",
  "object_uuid": "123e4567-0bd8-4b31-933e-23437b9fdcbb",
  "timestamp": "2025-09-01T15:10:00Z",
  "event_type": "updated",
  "changes": {
    "status": "Work Order",
    "quote_sent": 1,
    "activities_added": ["activity-uuid-1"],
    "attachments_added": ["photo-uuid-1", "photo-uuid-2"]
  },
  "related_objects": {
    "staff_assigned": "staff-uuid-123",
    "materials_updated": true,
    "activities_modified": true
  }
}
```

### Enhanced Webhook Processor Steps:

1. **Comprehensive Validation** - Verify webhook signature and validate object exists
2. **Smart Event Processing** - Process different event types (created, updated, status_changed, attachment_added)
3. **Related Data Sync** - Automatically sync related activities, attachments, and materials
4. **Intelligent Broadcasting** - Send targeted real-time updates based on change type
5. **Enhanced Logging** - Log detailed processing information for troubleshooting

---

## 9) Maintenance and Service Contract APIs

**Service Agreement Endpoint:**
* **Endpoint:** `GET /api_1.0/serviceagreement.json?$filter=company_uuid eq '{company_uuid}'`
* **Purpose:** Track maintenance contracts and recurring services

**Recurring Job Templates:**
* **Endpoint:** `GET /api_1.0/recurringjob.json?$filter=company_uuid eq '{company_uuid}'`
* **Purpose:** Manage scheduled maintenance and preventive services

---

## 10) Advanced Filtering and Search

**Complex Filtering Examples:**

```
# Jobs in last 30 days with photos
GET /api_1.0/job.json?$filter=company_uuid eq '{uuid}' AND date gt '2025-08-01' AND attachments_count gt 0

# Emergency jobs with high priority
GET /api_1.0/job.json?$filter=company_uuid eq '{uuid}' AND job_priority eq 'High' AND status eq 'Emergency'

# Completed jobs with customer feedback
GET /api_1.0/job.json?$filter=company_uuid eq '{uuid}' AND status eq 'Completed' AND customer_rating gt 0

# Jobs with specific technician assignments
GET /api_1.0/job.json?$filter=company_uuid eq '{uuid}' AND staff_assigned eq '{staff_uuid}'
```

---

## 11) Enhanced Error Handling and Retry Logic

**Robust API Client Implementation:**

```typescript
class EnhancedSM8Client {
  async getJobsWithRetry(companyUuid: string, options?: {
    includeActivities?: boolean;
    includeAttachments?: boolean;
    includeMaterials?: boolean;
    dateRange?: { start: string; end: string };
    status?: string[];
  }) {
    const filters = this.buildFilters(companyUuid, options);
    const expand = this.buildExpand(options);
    
    return await this.retryRequest(async () => {
      return await this.client.get(`/job.json?${filters}&${expand}`);
    });
  }

  private async retryRequest<T>(request: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await request();
      } catch (error) {
        if (this.isRateLimitError(error) && i < maxRetries - 1) {
          await this.waitForRateLimit(error);
          continue;
        }
        throw error;
      }
    }
  }
}
```

---

## 12) Performance Optimization Strategies

**Efficient Data Synchronization:**
* Use `$expand` to reduce API calls
* Implement smart caching with TTL
* Use date-based incremental sync
* Batch process webhook events
* Implement connection pooling for high-volume operations

**Pagination Best Practices:**
* Use `$top` and `$skip` for large datasets
* Implement cursor-based pagination where supported
* Cache frequently accessed data locally
* Use background sync for large initial imports

---

## 13) Integration Testing and Validation

**Comprehensive Testing Strategy:**
* Test all CRUD operations with real ServiceM8 sandbox
* Validate webhook signature verification
* Test rate limiting and backoff strategies
* Verify data consistency after sync operations
* Test partial failures and recovery scenarios

**Sandbox Environment Setup:**
* Use ServiceM8 test company for development
* Create test jobs with various statuses
* Upload test attachments and photos
* Configure webhook endpoints for testing
* Validate all API scopes and permissions

---

## Implementation Checklist for Enhanced Features

### Core Enhancements
- [ ] Implement enhanced job sync with activities and attachments
- [ ] Build technician tracking and assignment system
- [ ] Create line item quote management
- [ ] Add materials and parts tracking
- [ ] Implement categorized document management

### Advanced Features
- [ ] Build maintenance contract tracking
- [ ] Create emergency service request handling
- [ ] Implement partial quote approval system
- [ ] Add photo organization and management
- [ ] Build service history and analytics

### Integration Quality
- [ ] Implement comprehensive error handling
- [ ] Add intelligent retry logic with exponential backoff
- [ ] Create webhook signature verification
- [ ] Build rate limiting and quota management
- [ ] Implement connection pooling for performance

### Data Synchronization
- [ ] Build incremental sync with date-based filtering
- [ ] Implement conflict resolution for data discrepancies
- [ ] Create data validation and sanitization
- [ ] Add sync monitoring and health checks
- [ ] Build rollback mechanisms for failed syncs

### Performance Optimization
- [ ] Implement smart caching with TTL
- [ ] Use pagination for large datasets
- [ ] Build background sync for initial imports
- [ ] Create connection pooling for high-volume operations
- [ ] Add query optimization and result filtering

---

## Key References and Documentation

* **ServiceM8 API Documentation** - Complete endpoint reference
* **Webhook Configuration** - Setup and security best practices  
* **OAuth2 Implementation** - Authentication flow for public apps
* **Rate Limiting Guidelines** - API usage limits and optimization
* **Sandbox Environment** - Testing and development best practices

---

## Critical Implementation Notes

**Security Requirements:**
* Never expose API keys in client-side code
* Always validate webhook signatures
* Implement proper error logging without exposing sensitive data
* Use HTTPS for all API communications

**Performance Considerations:**
* ServiceM8 has a 20,000 request/day limit
* Implement aggressive caching for frequently accessed data
* Use batch operations where possible
* Monitor API usage and implement alerting

**Data Consistency:**
* Always fetch fresh data after webhook events
* Implement idempotency for webhook processing
* Use database transactions for multi-table updates
* Build reconciliation jobs to catch missed updates

**Error Handling:**
* Log all API errors with correlation IDs
* Implement graceful degradation for API failures
* Provide user-friendly error messages
* Build admin alerts for critical API failures