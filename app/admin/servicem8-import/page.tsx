'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SimpleToast } from '@/components/ui/Toast';

interface SyncResult {
  success: boolean;
  data?: {
    syncedRecords?: number;
    totalRecords?: number;
    errors?: string[];
  };
  error?: string;
  message?: string;
}

export default function ServiceM8DataImport() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/servicem8/test-connection');
      const result = await response.json();
      
      if (result.success) {
        showToast('ServiceM8 API connection successful', 'success');
      } else {
        showToast(`Connection failed: ${result.message}`, 'error');
      }
    } catch {
      showToast('Failed to test connection', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const syncCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/servicem8/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_companies' }),
      });
      
      const result = await response.json();
      setLastSyncResult(result);
      
      if (result.success) {
        showToast(`Synced ${result.data.syncedRecords} companies`, 'success');
      } else {
        showToast(`Sync failed: ${result.message}`, 'error');
      }
    } catch {
      showToast('Failed to sync companies', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const performFullSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/servicem8/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full_sync' }),
      });
      
      const result = await response.json();
      setLastSyncResult(result);
      
      if (result.success) {
        const { companies, jobs, quotes } = result.data;
        const totalSynced = companies.syncedRecords + 
          jobs.reduce((sum: number, j: { syncedRecords: number }) => sum + j.syncedRecords, 0) +
          quotes.reduce((sum: number, q: { syncedRecords: number }) => sum + q.syncedRecords, 0);
        
        showToast(`Full sync completed: ${totalSynced} records synced`, 'success');
      } else {
        showToast(`Full sync failed: ${result.message}`, 'error');
      }
    } catch {
      showToast('Failed to perform full sync', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">ServiceM8 Data Import</h1>
        <Button
          onClick={testConnection}
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Connection</span>
              <span className="text-sm font-medium text-green-600">Ready</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rate Limit</span>
              <span className="text-sm font-medium text-blue-600">20,000/day</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cache Status</span>
              <span className="text-sm font-medium text-green-600">Enabled</span>
            </div>
          </div>
        </Card>

        {/* Sync Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Sync Actions</h2>
          <div className="space-y-3">
            <Button
              onClick={syncCompanies}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Syncing...' : 'Sync Companies'}
            </Button>
            
            <Button
              onClick={performFullSync}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? 'Syncing...' : 'Full Sync (All Data)'}
            </Button>
          </div>
        </Card>


        {/* Last Sync Result */}
        {lastSyncResult && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Last Sync Result</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`text-sm font-medium ${
                  lastSyncResult.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {lastSyncResult.success ? 'Success' : 'Failed'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Message</span>
                <span className="text-sm font-medium">{lastSyncResult.message}</span>
              </div>
              {lastSyncResult.data && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <pre className="text-xs text-gray-600 overflow-auto">
                    {JSON.stringify(lastSyncResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Instructions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Import Instructions</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>1. <strong>Test Connection:</strong> Verify ServiceM8 API credentials are working</p>
          <p>2. <strong>Sync Companies:</strong> Import all client companies from ServiceM8</p>
          <p>3. <strong>Full Sync:</strong> Import all jobs, quotes, and related data</p>
          <p>4. <strong>Monitor Status:</strong> Check sync results and resolve any errors</p>
          <p className="text-yellow-600">
            <strong>Note:</strong> Full sync may take several minutes for large datasets. 
            Monitor the progress and check for any error messages.
          </p>
        </div>
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
