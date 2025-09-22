# ServiceM8 Integration Documentation

## Overview

The ServiceM8 integration provides a comprehensive API client and data synchronization system for the SmartTech Client Portal. This integration allows the portal to fetch, sync, and manage data from ServiceM8, including jobs, quotes, clients, staff, and related information.

## Architecture

### Core Components

1. **ServiceM8Client** (`services/servicem8-client.ts`)
   - Main API client with authentication, rate limiting, and caching
   - Handles all ServiceM8 API interactions
   - Implements retry logic with exponential backoff

2. **ServiceM8SyncService** (`services/servicem8-sync.ts`)
   - Data synchronization between ServiceM8 and Supabase
   - Handles upsert operations for companies, jobs, and quotes
   - Manages sync status and error tracking

3. **API Routes** (`app/api/servicem8/`)
   - RESTful endpoints for ServiceM8 operations
   - Test connection, data fetching, and sync management
   - Quote approval and rejection workflows

4. **TypeScript Types** (`types/servicem8.ts`)
   - Comprehensive type definitions for all ServiceM8 entities
   - API response types and configuration interfaces
   - Enhanced types with related data support

## Features

### ✅ Implemented Features

- **API Client with Authentication**
  - Support for both API Key and OAuth2 authentication
  - Automatic retry with exponential backoff
  - Rate limiting compliance (20,000 requests/day)
  - Response caching with TTL

- **Data Synchronization**
  - Company/client synchronization
  - Job and quote synchronization
  - Activity, attachment, and material tracking
  - Sync status monitoring and error handling

- **Quote Management**
  - Quote approval workflow
  - Quote rejection with reason tracking
  - Partial approval support (line items)
  - Quote status tracking

- **Admin Tools**
  - Data import interface
  - Sync status monitoring
  - Connection testing
  - Full sync capabilities

- **Error Handling**
  - Comprehensive error logging
  - Graceful degradation
  - User-friendly error messages
  - Admin alerting for critical failures

## API Endpoints

### Connection & Testing

- `GET /api/servicem8/test-connection` - Test API connection
- `GET /api/servicem8/test-integration` - Comprehensive integration test
- `POST /api/servicem8/test-integration` - Run specific sync tests

### Data Management

- `GET /api/servicem8/jobs` - Get jobs for a company
- `POST /api/servicem8/jobs` - Get quotes for a company
- `POST /api/servicem8/quotes` - Approve a quote
- `DELETE /api/servicem8/quotes` - Reject a quote

### Synchronization

- `POST /api/servicem8/sync` - Perform data synchronization
  - `action: 'sync_companies'` - Sync all companies
  - `action: 'sync_jobs'` - Sync jobs for a company
  - `action: 'sync_quotes'` - Sync quotes for a company
  - `action: 'full_sync'` - Perform complete sync
  - `action: 'get_sync_status'` - Get sync status

## Configuration

### Environment Variables

```bash
# ServiceM8 API Configuration
SERVICEM8_API_KEY=your_api_key                    # For private apps
SERVICEM8_OAUTH_TOKEN=your_oauth_token           # For public apps
SERVICEM8_CLIENT_ID=your_client_id              # For OAuth2
SERVICEM8_CLIENT_SECRET=your_client_secret      # For OAuth2

# Optional Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret              # For webhook verification
```

### Client Configuration

```typescript
const client = new ServiceM8Client({
  apiKey: process.env.SERVICEM8_API_KEY,
  baseUrl: 'https://api.servicem8.com/api_1.0',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
  rateLimitEnabled: true,
});
```

## Usage Examples

### Basic API Usage

```typescript
import { serviceM8Client } from '@/services/servicem8-client';

// Get companies
const companies = await serviceM8Client.getClients();

// Get jobs for a company
const jobs = await serviceM8Client.getJobs('company-uuid', {
  includeActivities: true,
  includeAttachments: true,
  dateRange: {
    start: '2024-01-01',
    end: '2024-12-31'
  }
});

// Approve a quote
await serviceM8Client.approveQuote('job-uuid', ['item1', 'item2'], 'Client approved');
```

### Data Synchronization

```typescript
import { serviceM8SyncService } from '@/services/servicem8-sync';

// Sync all companies
const companiesStatus = await serviceM8SyncService.syncCompanies();

// Sync jobs for a specific company
const jobsStatus = await serviceM8SyncService.syncJobsForCompany('company-uuid', {
  includeActivities: true,
  includeAttachments: true,
  includeMaterials: true
});

// Perform full sync
const fullSyncStatus = await serviceM8SyncService.performFullSync();
```

### API Route Usage

```typescript
// Test connection
const response = await fetch('/api/servicem8/test-connection');
const result = await response.json();

// Sync companies
const syncResponse = await fetch('/api/servicem8/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'sync_companies' })
});

// Approve quote
const approveResponse = await fetch('/api/servicem8/quotes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobUuid: 'job-uuid',
    approvedLineItems: ['item1', 'item2'],
    clientNotes: 'Approved all items'
  })
});
```

## Data Flow

### Synchronization Process

1. **Initial Setup**
   - Configure ServiceM8 API credentials
   - Test connection and verify permissions
   - Set up webhook endpoints (if available)

2. **Data Import**
   - Sync all companies from ServiceM8
   - Import jobs and quotes for each company
   - Sync related data (activities, attachments, materials)

3. **Ongoing Sync**
   - Process webhook events for real-time updates
   - Run scheduled reconciliation jobs
   - Handle sync errors and retries

4. **Quote Management**
   - Client approves/rejects quotes in portal
   - Update ServiceM8 job status
   - Track approval history and reasons

## Error Handling

### API Errors

- **Rate Limiting**: Automatic retry with exponential backoff
- **Network Errors**: Retry with increasing delays
- **Authentication Errors**: Clear error messages for credential issues
- **Data Validation**: Comprehensive validation with detailed error messages

### Sync Errors

- **Failed Records**: Track and log individual record failures
- **Partial Syncs**: Continue processing even if some records fail
- **Error Recovery**: Retry failed operations with backoff
- **Admin Alerts**: Notify administrators of critical sync failures

## Performance Considerations

### Caching Strategy

- **API Responses**: Cache frequently accessed data with 5-minute TTL
- **Company Data**: Cache company information to reduce API calls
- **Job Status**: Cache job status for quick lookups
- **Cache Invalidation**: Clear cache on data updates

### Rate Limiting

- **Request Throttling**: Respect ServiceM8's 20,000 requests/day limit
- **Batch Operations**: Group related requests when possible
- **Priority Queuing**: Prioritize critical operations (quote approvals)

### Data Optimization

- **Pagination**: Use pagination for large datasets
- **Selective Sync**: Only sync changed data when possible
- **Background Processing**: Run large syncs in background
- **Incremental Updates**: Use date-based filtering for updates

## Testing

### Integration Tests

Run comprehensive integration tests:

```bash
# Test all functionality
GET /api/servicem8/test-integration

# Test specific components
GET /api/servicem8/test-integration?type=connection
GET /api/servicem8/test-integration?type=companies
GET /api/servicem8/test-integration?type=jobs&company_uuid=uuid
```

### Manual Testing

1. **Connection Test**: Verify API credentials and connectivity
2. **Data Fetching**: Test retrieval of companies, jobs, and quotes
3. **Sync Operations**: Test data synchronization workflows
4. **Quote Management**: Test approval and rejection flows
5. **Error Handling**: Test error scenarios and recovery

## Monitoring & Maintenance

### Health Checks

- **API Connectivity**: Regular connection tests
- **Sync Status**: Monitor sync success rates
- **Error Rates**: Track and alert on high error rates
- **Performance**: Monitor response times and throughput

### Logging

- **API Calls**: Log all ServiceM8 API interactions
- **Sync Operations**: Track sync progress and results
- **Errors**: Detailed error logging with context
- **Audit Trail**: Complete audit log of all operations

### Maintenance Tasks

- **Cache Cleanup**: Regular cache maintenance
- **Error Recovery**: Automated retry of failed operations
- **Data Validation**: Periodic data consistency checks
- **Performance Optimization**: Monitor and optimize slow queries

## Security Considerations

### API Security

- **Credential Management**: Secure storage of API keys
- **HTTPS Only**: All API communications over HTTPS
- **Rate Limiting**: Prevent abuse and respect limits
- **Error Sanitization**: Don't expose sensitive data in errors

### Data Security

- **RLS Policies**: Row-level security for all data
- **Access Control**: Role-based access to ServiceM8 data
- **Audit Logging**: Complete audit trail of all operations
- **Data Encryption**: Encrypt sensitive data at rest

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check API credentials
   - Verify network connectivity
   - Confirm ServiceM8 service status

2. **Sync Errors**
   - Review error logs for specific failures
   - Check data validation issues
   - Verify database permissions

3. **Rate Limiting**
   - Monitor API usage
   - Implement request throttling
   - Use caching to reduce API calls

4. **Data Inconsistencies**
   - Run reconciliation jobs
   - Check webhook processing
   - Verify sync status

### Debug Tools

- **Integration Test**: `/api/servicem8/test-integration`
- **Connection Test**: `/api/servicem8/test-connection`
- **Sync Status**: Check sync status via API
- **Admin Interface**: Use admin tools for monitoring

## Future Enhancements

### Planned Features

- **Webhook Processing**: Real-time webhook event handling
- **Advanced Filtering**: Enhanced query capabilities
- **Bulk Operations**: Batch processing for large datasets
- **Analytics**: ServiceM8 data analytics and reporting
- **Mobile Sync**: Offline sync capabilities
- **Custom Fields**: Support for custom ServiceM8 fields

### Integration Opportunities

- **Calendar Integration**: Sync with Google/Outlook calendars
- **Document Management**: Enhanced document handling
- **Communication**: Integration with ServiceM8 messaging
- **Reporting**: Advanced reporting and analytics
- **Automation**: Workflow automation and triggers

## Support

For issues or questions regarding the ServiceM8 integration:

1. Check the troubleshooting section above
2. Review error logs and sync status
3. Run integration tests to identify issues
4. Contact the development team with specific error details

## Changelog

### Version 1.0.0 (Current)
- Initial ServiceM8 integration implementation
- API client with authentication and rate limiting
- Data synchronization service
- Quote management workflows
- Admin tools and monitoring
- Comprehensive error handling
- TypeScript type definitions
- Integration testing suite
