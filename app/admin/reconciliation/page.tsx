'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  RefreshCw, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Activity,
  Zap,
  BarChart3
} from 'lucide-react';

interface ReconciliationStatus {
  id: string;
  type: 'full' | 'incremental' | 'emergency';
  status: 'running' | 'completed' | 'failed' | 'pending';
  startedAt: string;
  completedAt?: string;
  recordsProcessed: number;
  errors: number;
  duration?: number;
}

export default function ReconciliationInterface() {
  const [isRunning, setIsRunning] = useState(false);
  const [reconciliationType, setReconciliationType] = useState<'full' | 'incremental' | 'emergency'>('incremental');
  const [reconciliationHistory, setReconciliationHistory] = useState<ReconciliationStatus[]>([]);
  const [currentStatus, setCurrentStatus] = useState<ReconciliationStatus | null>(null);

  const handleStartReconciliation = async () => {
    setIsRunning(true);
    
    try {
      const response = await fetch('/api/admin/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reconciliationType }),
      });

      const result = await response.json();
      
      if (result.success) {
        setCurrentStatus(result.data);
        // Start polling for status updates
        pollReconciliationStatus(result.data.id);
      }
    } catch (error) {
      console.error('Failed to start reconciliation:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const pollReconciliationStatus = async (reconciliationId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/reconciliation/${reconciliationId}`);
        const result = await response.json();
        
        if (result.success) {
          setCurrentStatus(result.data);
          
          if (result.data.status === 'completed' || result.data.status === 'failed') {
            clearInterval(pollInterval);
            fetchReconciliationHistory();
          }
        }
      } catch (error) {
        console.error('Failed to poll reconciliation status:', error);
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds
  };

  const fetchReconciliationHistory = async () => {
    try {
      const response = await fetch('/api/admin/reconciliation/history');
      const result = await response.json();
      
      if (result.success) {
        setReconciliationHistory(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch reconciliation history:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Reconciliation</h1>
          <p className="text-gray-600 mt-1">
            Manual data synchronization and consistency checks
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={fetchReconciliationHistory}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View History
          </Button>
        </div>
      </div>

      {/* Reconciliation Controls */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Start Reconciliation</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Reconciliation Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reconciliation Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="incremental"
                  checked={reconciliationType === 'incremental'}
                  onChange={(e) => setReconciliationType(e.target.value as 'incremental' | 'full')}
                  className="mr-2"
                />
                <div>
                  <div className="text-sm font-medium">Incremental</div>
                  <div className="text-xs text-gray-500">Sync recent changes only</div>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="full"
                  checked={reconciliationType === 'full'}
                  onChange={(e) => setReconciliationType(e.target.value as 'incremental' | 'full')}
                  className="mr-2"
                />
                <div>
                  <div className="text-sm font-medium">Full Sync</div>
                  <div className="text-xs text-gray-500">Complete data synchronization</div>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="emergency"
                  checked={reconciliationType === 'emergency'}
                  onChange={(e) => setReconciliationType(e.target.value as 'incremental' | 'full')}
                  className="mr-2"
                />
                <div>
                  <div className="text-sm font-medium">Emergency</div>
                  <div className="text-xs text-gray-500">Force sync with conflict resolution</div>
                </div>
              </label>
            </div>
          </div>

          {/* Current Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Status
            </label>
            {currentStatus ? (
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Reconciliation #{currentStatus.id}</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentStatus.status)}`}>
                    {getStatusIcon(currentStatus.status)}
                    <span className="ml-1">{currentStatus.status}</span>
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Started: {new Date(currentStatus.startedAt).toLocaleString()}</div>
                  <div>Records: {currentStatus.recordsProcessed}</div>
                  {currentStatus.errors > 0 && (
                    <div className="text-red-600">Errors: {currentStatus.errors}</div>
                  )}
                  {currentStatus.duration && (
                    <div>Duration: {formatDuration(currentStatus.duration)}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-500">
                No active reconciliation
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actions
            </label>
            <div className="space-y-2">
              <Button
                onClick={handleStartReconciliation}
                disabled={isRunning || (currentStatus?.status === 'running')}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Start {reconciliationType} Sync
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Reconciliation History */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Reconciliation History</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Errors
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reconciliationHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No reconciliation history available
                  </td>
                </tr>
              ) : (
                reconciliationHistory.map((reconciliation) => (
                  <tr key={reconciliation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      #{reconciliation.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        reconciliation.type === 'full' ? 'bg-blue-100 text-blue-800' :
                        reconciliation.type === 'incremental' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {reconciliation.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reconciliation.status)}`}>
                        {getStatusIcon(reconciliation.status)}
                        <span className="ml-1">{reconciliation.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(reconciliation.startedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reconciliation.duration ? formatDuration(reconciliation.duration) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reconciliation.recordsProcessed.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reconciliation.errors > 0 ? (
                        <span className="text-red-600">{reconciliation.errors}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* System Information */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Last Full Sync</p>
                <p className="text-xs text-blue-700">2 hours ago</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Data Consistency</p>
                <p className="text-xs text-green-700">99.8%</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900">Avg Sync Time</p>
                <p className="text-xs text-yellow-700">3.2 minutes</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Sync Frequency</p>
                <p className="text-xs text-purple-700">Every 15 min</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
