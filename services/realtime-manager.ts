import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * ServiceM8 Realtime Subscription Manager
 * Handles client-side realtime subscriptions for webhook updates
 */
export class ServiceM8RealtimeManager {
  private supabase;
  private channels = new Map<string, RealtimeChannel>();
  private connectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    // Pass no arguments to createClient() if your project is configured to use env vars,
    // otherwise pass the required URL and anon key.
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  private reconnectDelay = 1000;

  /**
   * Subscribe to job updates for a specific company
   */
  async subscribeToJobs(
    companyUuid: string,
    onUpdate: (data: Record<string, unknown>) => void
  ): Promise<RealtimeChannel> {
    const channelName = `jobs:${companyUuid}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'broadcast',
        { event: 'webhook_update' },
        (payload) => {
          console.log('Job update received:', payload);
          onUpdate(payload.payload);
        }
      )
      .subscribe((status) => {
        console.log(`Jobs channel ${channelName} status:`, status);
        this.handleChannelStatus(status, channelName);
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to quote updates for a specific company
   */
  async subscribeToQuotes(
    companyUuid: string,
    onUpdate: (data: Record<string, unknown>) => void
  ): Promise<RealtimeChannel> {
    const channelName = `quotes:${companyUuid}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'broadcast',
        { event: 'webhook_update' },
        (payload) => {
          console.log('Quote update received:', payload);
          onUpdate(payload.payload);
        }
      )
      .subscribe((status) => {
        console.log(`Quotes channel ${channelName} status:`, status);
        this.handleChannelStatus(status, channelName);
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to job activity updates for a specific job
   */
  async subscribeToJobActivities(
    jobUuid: string,
    onUpdate: (data: Record<string, unknown>) => void
  ): Promise<RealtimeChannel> {
    const channelName = `job_activities:${jobUuid}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'broadcast',
        { event: 'webhook_update' },
        (payload) => {
          console.log('Job activity update received:', payload);
          onUpdate(payload.payload);
        }
      )
      .subscribe((status) => {
        console.log(`Job activities channel ${channelName} status:`, status);
        this.handleChannelStatus(status, channelName);
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to attachment updates for a specific job
   */
  async subscribeToAttachments(
    jobUuid: string,
    onUpdate: (data: Record<string, unknown>) => void
  ): Promise<RealtimeChannel> {
    const channelName = `attachments:${jobUuid}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'broadcast',
        { event: 'webhook_update' },
        (payload) => {
          console.log('Attachment update received:', payload);
          onUpdate(payload.payload);
        }
      )
      .subscribe((status) => {
        console.log(`Attachments channel ${channelName} status:`, status);
        this.handleChannelStatus(status, channelName);
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to company updates
   */
  async subscribeToCompany(
    companyUuid: string,
    onUpdate: (data: Record<string, unknown>) => void
  ): Promise<RealtimeChannel> {
    const channelName = `companies:${companyUuid}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'broadcast',
        { event: 'webhook_update' },
        (payload) => {
          console.log('Company update received:', payload);
          onUpdate(payload.payload);
        }
      )
      .subscribe((status) => {
        console.log(`Company channel ${channelName} status:`, status);
        this.handleChannelStatus(status, channelName);
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Handle channel connection status
   */
  private handleChannelStatus(status: string, channelName: string): void {
    console.log(`Channel ${channelName} status changed to: ${status}`);
    
    if (status === 'SUBSCRIBED') {
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      this.connectionStatus = 'error';
      this.attemptReconnect(channelName);
    } else if (status === 'CLOSED') {
      this.connectionStatus = 'disconnected';
    }
  }

  /**
   * Attempt to reconnect to a channel
   */
  private attemptReconnect(channelName: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for channel: ${channelName}`);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect to ${channelName} in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      const channel = this.channels.get(channelName);
      if (channel) {
        channel.unsubscribe();
        this.channels.delete(channelName);
        // The channel will be recreated when the user tries to subscribe again
      }
    }, delay);
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribeFromChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
      console.log(`Unsubscribed from channel: ${channelName}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeFromAllChannels(): void {
    this.channels.forEach((channel, channelName) => {
      channel.unsubscribe();
      console.log(`Unsubscribed from channel: ${channelName}`);
    });
    this.channels.clear();
    this.connectionStatus = 'disconnected';
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  /**
   * Get active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Check if connected to any channels
   */
  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.channels.size > 0;
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    status: string;
    activeChannels: number;
    reconnectAttempts: number;
    channels: string[];
  } {
    return {
      status: this.connectionStatus,
      activeChannels: this.channels.size,
      reconnectAttempts: this.reconnectAttempts,
      channels: this.getActiveChannels(),
    };
  }
}

// Export singleton instance
export const realtimeManager = new ServiceM8RealtimeManager();

// React hook for using realtime subscriptions
export function useServiceM8Realtime() {
  return {
    subscribeToJobs: realtimeManager.subscribeToJobs.bind(realtimeManager),
    subscribeToQuotes: realtimeManager.subscribeToQuotes.bind(realtimeManager),
    subscribeToJobActivities: realtimeManager.subscribeToJobActivities.bind(realtimeManager),
    subscribeToAttachments: realtimeManager.subscribeToAttachments.bind(realtimeManager),
    subscribeToCompany: realtimeManager.subscribeToCompany.bind(realtimeManager),
    unsubscribeFromChannel: realtimeManager.unsubscribeFromChannel.bind(realtimeManager),
    unsubscribeFromAllChannels: realtimeManager.unsubscribeFromAllChannels.bind(realtimeManager),
    getConnectionStatus: realtimeManager.getConnectionStatus.bind(realtimeManager),
    getActiveChannels: realtimeManager.getActiveChannels.bind(realtimeManager),
    isConnected: realtimeManager.isConnected.bind(realtimeManager),
    getConnectionStats: realtimeManager.getConnectionStats.bind(realtimeManager),
  };
}
