'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SimpleToast } from '@/components/ui/Toast';

interface WebhookEvent {
  id: string;
  sm8_event_id: string;
  payload: Record<string, unknown>;
  status: 'queued' | 'processing' | 'success' | 'failed';
  processed_at: string | null;
  error_details: string | null;
  created_at: string;
}

interface WebhookStats {
  total: number;
  queued: number;
  processing: number;
  success: number;
  failed: number;
  successRate: number;
}

export default function WebhookDashboard() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
  };

  // Fetch webhook events
  const fetchEvents = useCallback(async (status?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      
      const response = await fetch(`/api/webhooks/management?action=events&${params}`);
      const result = await response.json();
      
      if (result.success) {
        setEvents(result.data);
      } else {
        showToast(`Failed to fetch events: ${result.message}`, 'error');
      }
    } catch {
      showToast('Failed to fetch webhook events', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch webhook statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/webhooks/management?action=stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      } else {
        showToast(`Failed to fetch stats: ${result.message}`, 'error');
      }
    } catch {
      showToast('Failed to fetch webhook statistics', 'error');
    }
  }, []);

  // Retry failed events
  const retryFailedEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/webhooks/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry_failed_events' }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        showToast(`Retried ${result.data.retryCount} failed events`, 'success');
        fetchStats();
        fetchEvents(selectedStatus);
      } else {
        showToast(`Failed to retry events: ${result.message}`, 'error');
      }
    } catch {
      showToast('Failed to retry events', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Retry specific event
  const retryEvent = async (eventId: string) => {
    try {
      const response = await fetch('/api/webhooks/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry_event', eventId }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        showToast(`Event ${eventId} retry initiated`, 'success');
        fetchStats();
        fetchEvents(selectedStatus);
      } else {
        showToast(`Failed to retry event: ${result.message}`, 'error');
      }
    } catch {
      showToast('Failed to retry event', 'error');
    }
  };

  // Delete old events
  const deleteOldEvents = async () => {
    if (!confirm('Are you sure you want to delete events older than 30 days?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/webhooks/management', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-delete-days': '30'
        },
        body: JSON.stringify({ action: 'delete_old_events' }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        showToast(`Deleted ${result.data.deletedCount} old events`, 'success');
        fetchStats();
        fetchEvents(selectedStatus);
      } else {
        showToast(`Failed to delete old events: ${result.message}`, 'error');
      }
    } catch {
      showToast('Failed to delete old events', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchStats();
    fetchEvents();
  }, [fetchStats, fetchEvents]);

  // Refresh data when status filter changes
  useEffect(() => {
    fetchEvents(selectedStatus);
  }, [selectedStatus, fetchEvents]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'queued': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Webhook Dashboard</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => fetchStats()}
            variant="outline"
            disabled={isLoading}
          >
            Refresh Stats
          </Button>
          <Button
            onClick={retryFailedEvents}
            disabled={isLoading}
            variant="outline"
          >
            Retry Failed Events
          </Button>
          <Button
            onClick={deleteOldEvents}
            disabled={isLoading}
            variant="outline"
          >
            Clean Old Events
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.success}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.successRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Events</option>
            <option value="queued">Queued</option>
            <option value="processing">Processing</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <Button
            onClick={() => fetchEvents(selectedStatus)}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </Card>

      {/* Events Table */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Webhook Events</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Object Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {event.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(event.payload as { object_type?: string })?.object_type || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(event.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.processed_at ? formatDate(event.processed_at) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex gap-2">
                      {event.status === 'failed' && (
                        <Button
                          onClick={() => retryEvent(event.id)}
                          size="sm"
                          variant="outline"
                        >
                          Retry
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          const details = {
                            id: event.id,
                            payload: event.payload,
                            error: event.error_details,
                          };
                          alert(JSON.stringify(details, null, 2));
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Details
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {events.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            No webhook events found
          </div>
        )}
      </Card>

      {/* Toast Notification */}
      {toast.show && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}
