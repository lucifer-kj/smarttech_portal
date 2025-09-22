import { NextRequest, NextResponse } from 'next/server';
import { serviceM8Client } from '@/services/servicem8-client';
import { serviceM8SyncService } from '@/services/servicem8-sync';

/**
 * Test ServiceM8 API connection
 */
export async function GET() {
  try {
    const isConnected = await serviceM8Client.testConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to connect to ServiceM8 API',
          message: 'Check your API credentials and network connection'
        },
        { status: 500 }
      );
    }

    const stats = serviceM8Client.getApiStats();
    
    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        rateLimit: stats.rateLimit,
        cacheStats: stats.cacheStats,
        timestamp: new Date().toISOString(),
      },
      message: 'ServiceM8 API connection successful'
    });
  } catch (error) {
    console.error('ServiceM8 connection test failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'ServiceM8 API test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Sync companies from ServiceM8
 */
export async function POST(request: NextRequest) {
  try {
    const { action, companyUuid, options } = await request.json();

    switch (action) {
      case 'sync_companies':
        const companiesStatus = await serviceM8SyncService.syncCompanies();
        return NextResponse.json({
          success: true,
          data: companiesStatus,
          message: `Synced ${companiesStatus.syncedRecords} companies`
        });

      case 'sync_jobs':
        if (!companyUuid) {
          return NextResponse.json(
            { success: false, error: 'Company UUID is required' },
            { status: 400 }
          );
        }
        
        const jobsStatus = await serviceM8SyncService.syncJobsForCompany(
          companyUuid, 
          options || {}
        );
        return NextResponse.json({
          success: true,
          data: jobsStatus,
          message: `Synced ${jobsStatus.syncedRecords} jobs for company ${companyUuid}`
        });

      case 'sync_quotes':
        if (!companyUuid) {
          return NextResponse.json(
            { success: false, error: 'Company UUID is required' },
            { status: 400 }
          );
        }
        
        const quotesStatus = await serviceM8SyncService.syncQuotesForCompany(
          companyUuid, 
          options || {}
        );
        return NextResponse.json({
          success: true,
          data: quotesStatus,
          message: `Synced ${quotesStatus.syncedRecords} quotes for company ${companyUuid}`
        });

      case 'full_sync':
        const fullSyncStatus = await serviceM8SyncService.performFullSync();
        return NextResponse.json({
          success: true,
          data: fullSyncStatus,
          message: 'Full sync completed'
        });

      case 'get_sync_status':
        if (!companyUuid) {
          return NextResponse.json(
            { success: false, error: 'Company UUID is required' },
            { status: 400 }
          );
        }
        
        const syncStatus = await serviceM8SyncService.getSyncStatus(companyUuid);
        return NextResponse.json({
          success: true,
          data: syncStatus,
          message: 'Sync status retrieved'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('ServiceM8 sync failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Sync operation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
