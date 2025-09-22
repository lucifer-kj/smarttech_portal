# ServiceM8 Webhook System Documentation

## Overview

The ServiceM8 Webhook System provides real-time event processing and synchronization between ServiceM8 and the SmartTech Client Portal. This system handles incoming webhook events, processes them asynchronously, and broadcasts real-time updates to connected clients.

## Architecture

### Core Components

1. **Webhook Endpoint** (`/api/webhooks/sm8`)
   - Receives webhook events from ServiceM8
   - Validates webhook signatures
   - Stores events for processing
   - Returns immediate acknowledgment

2. **Webhook Processor** (`services/webhook-processor.ts`)
   - Processes webhook events asynchronously
   - Implements retry logic with exponential backoff
   - Handles different object types and event types
   - Manages idempotency to prevent duplicate processing

3. **Realtime Manager** (`services/realtime-manager.ts`)
   - Manages Supabase Realtime subscriptions
   - Handles connection monitoring and reconnection
   - Provides client-side subscription management

4. **Webhook Management API** (`/api/webhooks/management`)
   - Provides webhook event monitoring
   - Enables manual retry of failed events
   - Offers statistics and analytics

5. **Admin Dashboard** (`/admin/webhook-dashboard`)
   - Visual webhook monitoring interface
   - Event management and retry capabilities
   - Real-time statistics and status tracking

## Webhook Configuration

### ServiceM8 Webhook Setup

To configure webhooks in ServiceM8:

1. **Access ServiceM8 Settings**
   - Log into your ServiceM8 account
   - Navigate to Settings → Integrations → Webhooks

2. **Create Webhook Endpoint**
   - **URL**: `https://your-domain.com/api/webhooks/sm8`
   - **Events**: Select the events you want to receive:
     - Job Created/Updated/Status Changed
     - Company Created/Updated
     - Job Activity Created/Updated/Completed
     - Attachment Created/Updated
     - Staff Created/Updated

3. **Webhook Secret** (Optional but Recommended)
   - ServiceM8 may provide a webhook secret for signature verification
   - Add this to your environment variables as `WEBHOOK_SECRET`

### Environment Variables

```bash
# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret_key  # From ServiceM8 webhook settings

# Supabase Configuration (for realtime)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Webhook Event Processing

### Event Flow

1. **Webhook Received**
   - ServiceM8 sends webhook to `/api/webhooks/sm8`
   - Endpoint validates signature (if secret provided)
   - Event stored in database with 'queued' status

2. **Event Processing**
   - Webhook processor picks up queued events
   - Status updated to 'processing'
   - Event processed based on object type and event type

3. **Data Synchronization**
   - Relevant data fetched from ServiceM8 API
   - Database updated with latest information
   - Status updated to 'success' or 'failed'

4. **Realtime Broadcasting**
   - Processed events broadcast via Supabase Realtime
   - Connected clients receive live updates
   - Event filtering by company/job UUID

### Supported Event Types

#### Job Events
- `created` - New job created
- `updated` - Job details updated
- `status_changed` - Job status changed
- `quote_sent` - Quote sent to client
- `quote_approved` - Quote approved by client
- `quote_rejected` - Quote rejected by client

#### Company Events
- `created` - New company created
- `updated` - Company details updated

#### Job Activity Events
- `created` - New activity created
- `updated` - Activity updated
- `completed` - Activity completed

#### Attachment Events
- `created` - New attachment added
- `updated` - Attachment updated

#### Staff Events
- `created` - New staff member added
- `updated` - Staff details updated

## Security Features

### Signature Verification

The webhook endpoint supports HMAC-SHA256 signature verification:

```typescript
// ServiceM8 sends signature in header
const signature = request.headers.get('x-servicem8-signature');

// Verify signature
const isValid = verifyWebhookSignature(body, signature, webhookSecret);
```

### Authentication Fallback

If signature verification fails or is not available, the system falls back to API validation by fetching the object from ServiceM8 API to verify it exists.

### Rate Limiting

The system respects ServiceM8's rate limits and implements exponential backoff for retries.

## Error Handling

### Retry Logic

- **Automatic Retry**: Failed events are automatically retried up to 3 times
- **Exponential Backoff**: Delay between retries increases exponentially
- **Manual Retry**: Admins can manually retry failed events via dashboard

### Error Tracking

- All errors are logged with detailed context
- Failed events are stored with error details
- Admin dashboard shows error statistics and details

## Realtime Updates

### Supabase Realtime Integration

The system uses Supabase Realtime to broadcast webhook updates to connected clients:

```typescript
// Broadcast job update
await supabase
  .channel('jobs')
  .send({
    type: 'broadcast',
    event: 'webhook_update',
    payload: {
      type: 'job_update',
      object_uuid: jobUuid,
      event_type: 'updated',
      changes: changes,
    }
  });
```

### Client-Side Subscriptions

React hooks provide easy webhook subscription management:

```typescript
import { useWebhookUpdates } from '@/hooks/useWebhookUpdates';

function JobComponent({ jobUuid, companyUuid }) {
  const { connectionStatus, isConnected } = useWebhookUpdates({
    companyUuid,
    jobUuid,
    onJobUpdate: (update) => {
      console.log('Job updated:', update);
      // Refresh job data
    },
    onActivityUpdate: (update) => {
      console.log('Activity updated:', update);
      // Refresh activities
    },
  });

  return (
    <div>
      <div>Connection: {connectionStatus}</div>
      {/* Job content */}
    </div>
  );
}
```

## Monitoring and Management

### Webhook Dashboard

Access the webhook dashboard at `/admin/webhook-dashboard` to:

- View webhook processing statistics
- Monitor event status (queued, processing, success, failed)
- Retry failed events manually
- View event details and error messages
- Clean up old events

### API Endpoints

#### Get Webhook Statistics
```bash
GET /api/webhooks/management?action=stats
```

#### Get Webhook Events
```bash
GET /api/webhooks/management?action=events&status=failed&limit=50
```

#### Retry Failed Events
```bash
POST /api/webhooks/management
{
  "action": "retry_failed_events"
}
```

#### Retry Specific Event
```bash
POST /api/webhooks/management
{
  "action": "retry_event",
  "eventId": "event-uuid"
}
```

## Testing

### Webhook Testing

1. **Test Webhook Endpoint**
   ```bash
   curl -X GET https://your-domain.com/api/webhooks/sm8
   ```

2. **Simulate Webhook Event**
   ```bash
   curl -X POST https://your-domain.com/api/webhooks/sm8 \
     -H "Content-Type: application/json" \
     -H "x-servicem8-signature: your-signature" \
     -d '{
       "object_type": "Job",
       "object_uuid": "job-uuid",
       "event_type": "updated",
       "timestamp": "2024-01-01T00:00:00Z",
       "changes": {"status": "Work Order"}
     }'
   ```

3. **Check Processing Status**
   ```bash
   curl https://your-domain.com/api/webhooks/management?action=stats
   ```

### Integration Testing

The system includes comprehensive integration tests:

```typescript
// Test webhook processing
const result = await webhookProcessor.processEvent(eventId, payload);

// Test realtime broadcasting
const channel = await realtimeManager.subscribeToJobs(companyUuid, onUpdate);

// Test error handling
const stats = await webhookProcessor.getProcessingStats();
```

## Troubleshooting

### Common Issues

1. **Webhook Not Received**
   - Check ServiceM8 webhook configuration
   - Verify endpoint URL is accessible
   - Check firewall and network settings

2. **Signature Verification Failed**
   - Verify `WEBHOOK_SECRET` environment variable
   - Check ServiceM8 webhook secret configuration
   - Ensure signature format matches expected format

3. **Events Not Processing**
   - Check webhook processor logs
   - Verify ServiceM8 API credentials
   - Check database connectivity

4. **Realtime Updates Not Working**
   - Verify Supabase Realtime is enabled
   - Check client subscription setup
   - Verify network connectivity

### Debug Tools

1. **Webhook Dashboard**: Monitor events and processing status
2. **API Logs**: Check server logs for detailed error information
3. **Database Queries**: Query webhook_events table directly
4. **Realtime Debug**: Use Supabase dashboard to monitor realtime channels

## Performance Considerations

### Optimization Strategies

1. **Batch Processing**: Process multiple events together when possible
2. **Caching**: Cache frequently accessed data to reduce API calls
3. **Connection Pooling**: Use connection pooling for database operations
4. **Async Processing**: Process events asynchronously to avoid blocking

### Monitoring

- Monitor webhook processing times
- Track error rates and retry patterns
- Monitor realtime connection stability
- Set up alerts for critical failures

## Security Best Practices

1. **Always Use HTTPS**: Ensure webhook endpoints are served over HTTPS
2. **Verify Signatures**: Always verify webhook signatures when available
3. **Validate Payloads**: Validate all incoming webhook payloads
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Logging**: Log all webhook events for audit purposes
6. **Error Handling**: Don't expose sensitive information in error messages

## Future Enhancements

### Planned Features

- **Webhook Filtering**: Filter events based on custom criteria
- **Event Transformation**: Transform events before processing
- **Multi-tenant Support**: Support for multiple ServiceM8 accounts
- **Advanced Analytics**: Detailed webhook analytics and reporting
- **Custom Event Handlers**: Allow custom event processing logic
- **Webhook Testing**: Built-in webhook testing and simulation tools

### Integration Opportunities

- **Slack Notifications**: Send notifications to Slack channels
- **Email Alerts**: Email notifications for critical events
- **SMS Notifications**: SMS alerts for urgent updates
- **External APIs**: Integrate with external systems
- **Workflow Automation**: Trigger automated workflows based on events

## Support

For issues or questions regarding the webhook system:

1. Check the troubleshooting section above
2. Review webhook dashboard for event status
3. Check server logs for detailed error information
4. Verify ServiceM8 webhook configuration
5. Contact the development team with specific error details

## Changelog

### Version 1.0.0 (Current)
- Initial webhook system implementation
- ServiceM8 webhook endpoint with signature verification
- Advanced event processing with retry logic
- Supabase Realtime integration
- Admin dashboard for webhook management
- React hooks for client-side subscriptions
- Comprehensive error handling and monitoring
- Security features and best practices
- Complete documentation and testing suite
