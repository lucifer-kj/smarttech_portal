'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  X, 
  RefreshCw,
  Bell,
  Database,
  Zap,
  Activity,
  Eye
} from 'lucide-react';

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  category: 'webhook' | 'sync' | 'database' | 'system';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  metadata?: Record<string, unknown>;
}

export default function SystemAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'webhook' | 'sync' | 'database' | 'system'>('all');
  const [showResolved, setShowResolved] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        filter,
        category: categoryFilter,
        show_resolved: showResolved.toString(),
      });

      const response = await fetch(`/api/admin/system-alerts?${params}`);
      const result = await response.json();

      if (result.success) {
        setAlerts(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch system alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, categoryFilter, showResolved]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/system-alerts/${alertId}/resolve`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/system-alerts/${alertId}/dismiss`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const getAlertIcon = (type: string, category: string) => {
    if (type === 'error') return <AlertTriangle className="h-5 w-5 text-red-600" />;
    if (type === 'warning') return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    if (type === 'success') return <CheckCircle className="h-5 w-5 text-green-600" />;
    
    switch (category) {
      case 'webhook':
        return <Zap className="h-5 w-5 text-blue-600" />;
      case 'sync':
        return <RefreshCw className="h-5 w-5 text-purple-600" />;
      case 'database':
        return <Database className="h-5 w-5 text-indigo-600" />;
      case 'system':
        return <Activity className="h-5 w-5 text-gray-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'webhook':
        return 'bg-blue-100 text-blue-800';
      case 'sync':
        return 'bg-purple-100 text-purple-800';
      case 'database':
        return 'bg-indigo-100 text-indigo-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const resolvedAlerts = alerts.filter(alert => alert.resolved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Alerts</h1>
          <p className="text-gray-600 mt-1">
            Monitor system health and resolve issues
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={fetchAlerts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Alerts</p>
              <p className="text-2xl font-semibold text-red-600">{activeAlerts.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Resolved Today</p>
              <p className="text-2xl font-semibold text-green-600">
                {resolvedAlerts.filter(alert => 
                  alert.resolvedAt && new Date(alert.resolvedAt).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Webhook Issues</p>
              <p className="text-2xl font-semibold text-blue-600">
                {activeAlerts.filter(alert => alert.category === 'webhook').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Sync Issues</p>
              <p className="text-2xl font-semibold text-purple-600">
                {activeAlerts.filter(alert => alert.category === 'sync').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'resolved')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Alerts</option>
              <option value="active">Active Only</option>
              <option value="resolved">Resolved Only</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | 'sync' | 'webhook' | 'system')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Categories</option>
              <option value="webhook">Webhooks</option>
              <option value="sync">Sync</option>
              <option value="database">Database</option>
              <option value="system">System</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Show resolved alerts</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-6">
            <div className="text-center text-gray-500">Loading alerts...</div>
          </Card>
        ) : alerts.length === 0 ? (
          <Card className="p-6">
            <div className="text-center text-gray-500">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">No alerts found</p>
              <p className="text-sm">System is running smoothly!</p>
            </div>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id} className={`p-6 border-l-4 ${getAlertColor(alert.type)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.type, alert.category)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{alert.title}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeColor(alert.category)}`}>
                        {alert.category}
                      </span>
                      {alert.resolved && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{alert.message}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatTimestamp(alert.timestamp)}
                      </span>
                      {alert.resolved && alert.resolvedAt && (
                        <span className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolved {formatTimestamp(alert.resolvedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!alert.resolved && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDismissAlert(alert.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
