import { useEffect, useRef, useState } from 'react';
import { useServiceM8Realtime } from '@/services/realtime-manager';

interface WebhookUpdate {
  type: string;
  object_uuid: string;
  event_type: string;
  changes?: Record<string, unknown>;
  timestamp: string;
}

interface UseWebhookUpdatesOptions {
  companyUuid?: string;
  jobUuid?: string;
  onJobUpdate?: (update: WebhookUpdate) => void;
  onQuoteUpdate?: (update: WebhookUpdate) => void;
  onActivityUpdate?: (update: WebhookUpdate) => void;
  onAttachmentUpdate?: (update: WebhookUpdate) => void;
  onCompanyUpdate?: (update: WebhookUpdate) => void;
  onError?: (error: unknown) => void;
}

/**
 * React hook for subscribing to ServiceM8 webhook updates
 */
export function useWebhookUpdates(options: UseWebhookUpdatesOptions) {
  const {
    companyUuid,
    jobUuid,
    onJobUpdate,
    onQuoteUpdate,
    onActivityUpdate,
    onAttachmentUpdate,
    onCompanyUpdate,
    onError,
  } = options;

  const realtime = useServiceM8Realtime();
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [activeChannels, setActiveChannels] = useState<string[]>([]);
  const channelsRef = useRef<string[]>([]);

  // Update connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = realtime.getConnectionStatus();
      const channels = realtime.getActiveChannels();
      
      setConnectionStatus(status);
      setActiveChannels(channels);
    }, 1000);

    return () => clearInterval(interval);
  }, [realtime]);

  // Subscribe to job updates
  useEffect(() => {
    if (!companyUuid || !onJobUpdate) return;

    const channelName = `jobs:${companyUuid}`;
    
    realtime.subscribeToJobs(companyUuid, (data) => {
      console.log('Job update received:', data);
      onJobUpdate(data as unknown as WebhookUpdate);
    });

    channelsRef.current.push(channelName);

    return () => {
      realtime.unsubscribeFromChannel(channelName);
      channelsRef.current = channelsRef.current.filter(ch => ch !== channelName);
    };
  }, [companyUuid, onJobUpdate, onError, realtime]);

  // Subscribe to quote updates
  useEffect(() => {
    if (!companyUuid || !onQuoteUpdate) return;

    const channelName = `quotes:${companyUuid}`;
    
    realtime.subscribeToQuotes(companyUuid, (data) => {
      console.log('Quote update received:', data);
      onQuoteUpdate(data as unknown as WebhookUpdate);
    });

    channelsRef.current.push(channelName);

    return () => {
      realtime.unsubscribeFromChannel(channelName);
      channelsRef.current = channelsRef.current.filter(ch => ch !== channelName);
    };
  }, [companyUuid, onQuoteUpdate, onError, realtime]);

  // Subscribe to job activity updates
  useEffect(() => {
    if (!jobUuid || !onActivityUpdate) return;

    const channelName = `job_activities:${jobUuid}`;
    
    realtime.subscribeToJobActivities(jobUuid, (data) => {
      console.log('Job activity update received:', data);
      onActivityUpdate(data as unknown as WebhookUpdate);
    });

    channelsRef.current.push(channelName);

    return () => {
      realtime.unsubscribeFromChannel(channelName);
      channelsRef.current = channelsRef.current.filter(ch => ch !== channelName);
    };
  }, [jobUuid, onActivityUpdate, onError, realtime]);

  // Subscribe to attachment updates
  useEffect(() => {
    if (!jobUuid || !onAttachmentUpdate) return;

    const channelName = `attachments:${jobUuid}`;
    
    realtime.subscribeToAttachments(jobUuid, (data) => {
      console.log('Attachment update received:', data);
      onAttachmentUpdate(data as unknown as WebhookUpdate);
    });

    channelsRef.current.push(channelName);

    return () => {
      realtime.unsubscribeFromChannel(channelName);
      channelsRef.current = channelsRef.current.filter(ch => ch !== channelName);
    };
  }, [jobUuid, onAttachmentUpdate, onError, realtime]);

  // Subscribe to company updates
  useEffect(() => {
    if (!companyUuid || !onCompanyUpdate) return;

    const channelName = `companies:${companyUuid}`;
    
    realtime.subscribeToCompany(companyUuid, (data) => {
      console.log('Company update received:', data);
      onCompanyUpdate(data as unknown as WebhookUpdate);
    });

    channelsRef.current.push(channelName);

    return () => {
      realtime.unsubscribeFromChannel(channelName);
      channelsRef.current = channelsRef.current.filter(ch => ch !== channelName);
    };
  }, [companyUuid, onCompanyUpdate, onError, realtime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      channelsRef.current.forEach(channel => {
        realtime.unsubscribeFromChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [realtime]);

  return {
    connectionStatus,
    activeChannels,
    isConnected: realtime.isConnected(),
    stats: realtime.getConnectionStats(),
  };
}

/**
 * Hook for job-specific webhook updates
 */
export function useJobWebhookUpdates(
  jobUuid: string,
  callbacks: {
    onJobUpdate?: (update: WebhookUpdate) => void;
    onActivityUpdate?: (update: WebhookUpdate) => void;
    onAttachmentUpdate?: (update: WebhookUpdate) => void;
    onError?: (error: unknown) => void;
  }
) {
  return useWebhookUpdates({
    jobUuid,
    ...callbacks,
  });
}

/**
 * Hook for company-specific webhook updates
 */
export function useCompanyWebhookUpdates(
  companyUuid: string,
  callbacks: {
    onJobUpdate?: (update: WebhookUpdate) => void;
    onQuoteUpdate?: (update: WebhookUpdate) => void;
    onCompanyUpdate?: (update: WebhookUpdate) => void;
    onError?: (error: unknown) => void;
  }
) {
  return useWebhookUpdates({
    companyUuid,
    ...callbacks,
  });
}

/**
 * Hook for quote-specific webhook updates
 */
export function useQuoteWebhookUpdates(
  companyUuid: string,
  callbacks: {
    onQuoteUpdate?: (update: WebhookUpdate) => void;
    onError?: (error: unknown) => void;
  }
) {
  return useWebhookUpdates({
    companyUuid,
    ...callbacks,
  });
}
