import { NextRequest, NextResponse } from 'next/server';
import { serviceM8Client } from '@/services/servicem8-client';
import { serviceM8SyncService } from '@/services/servicem8-sync';

/**
 * Comprehensive ServiceM8 Integration Test
 * Tests all major functionality of the ServiceM8 integration
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('type') || 'all';
  const companyUuid = searchParams.get('company_uuid');

  const results: {
    timestamp: string;
    testType: string;
    tests: Record<string, Record<string, unknown>>;
    summary?: Record<string, unknown>;
  } = {
    timestamp: new Date().toISOString(),
    testType,
    tests: {},
  };

  try {
    // Test 1: API Connection
    if (testType === 'all' || testType === 'connection') {
      console.log('Testing ServiceM8 API connection...');
      const isConnected = await serviceM8Client.testConnection();
      results.tests.connection = {
        success: isConnected,
        message: isConnected ? 'API connection successful' : 'API connection failed',
      };
    }

    // Test 2: API Stats
    if (testType === 'all' || testType === 'stats') {
      console.log('Getting API statistics...');
      const stats = serviceM8Client.getApiStats();
      results.tests.stats = {
        success: true,
        data: stats,
        message: 'API statistics retrieved',
      };
    }

    // Test 3: Get Companies
    if (testType === 'all' || testType === 'companies') {
      console.log('Testing companies fetch...');
      try {
        const companiesResponse = await serviceM8Client.getClients();
        results.tests.companies = {
          success: true,
          count: companiesResponse.data.length,
          message: `Retrieved ${companiesResponse.data.length} companies`,
          sample: companiesResponse.data.slice(0, 2), // First 2 companies as sample
        };
      } catch (error) {
        results.tests.companies = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to fetch companies',
        };
      }
    }

    // Test 4: Get Jobs (if company UUID provided)
    if ((testType === 'all' || testType === 'jobs') && companyUuid) {
      console.log(`Testing jobs fetch for company ${companyUuid}...`);
      try {
        const jobsResponse = await serviceM8Client.getJobs(companyUuid, {
          limit: 5, // Limit to 5 jobs for testing
        });
        results.tests.jobs = {
          success: true,
          count: jobsResponse.data.length,
          message: `Retrieved ${jobsResponse.data.length} jobs for company ${companyUuid}`,
          sample: jobsResponse.data.slice(0, 2), // First 2 jobs as sample
        };
      } catch (error) {
        results.tests.jobs = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to fetch jobs',
        };
      }
    }

    // Test 5: Get Quotes (if company UUID provided)
    if ((testType === 'all' || testType === 'quotes') && companyUuid) {
      console.log(`Testing quotes fetch for company ${companyUuid}...`);
      try {
        const quotesResponse = await serviceM8Client.getQuotes(companyUuid, {
          limit: 5, // Limit to 5 quotes for testing
        });
        results.tests.quotes = {
          success: true,
          count: quotesResponse.data.length,
          message: `Retrieved ${quotesResponse.data.length} quotes for company ${companyUuid}`,
          sample: quotesResponse.data.slice(0, 2), // First 2 quotes as sample
        };
      } catch (error) {
        results.tests.quotes = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to fetch quotes',
        };
      }
    }

    // Test 6: Get Staff
    if (testType === 'all' || testType === 'staff') {
      console.log('Testing staff fetch...');
      try {
        const staffResponse = await serviceM8Client.getStaff();
        results.tests.staff = {
          success: true,
          count: staffResponse.data.length,
          message: `Retrieved ${staffResponse.data.length} staff members`,
          sample: staffResponse.data.slice(0, 2), // First 2 staff as sample
        };
      } catch (error) {
        results.tests.staff = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to fetch staff',
        };
      }
    }

    // Test 7: Cache Operations
    if (testType === 'all' || testType === 'cache') {
      console.log('Testing cache operations...');
      try {
        const cacheStats = serviceM8Client.getCacheStats();
        serviceM8Client.clearCache();
        const clearedStats = serviceM8Client.getCacheStats();
        
        results.tests.cache = {
          success: true,
          beforeClear: cacheStats,
          afterClear: clearedStats,
          message: 'Cache operations successful',
        };
      } catch (error) {
        results.tests.cache = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to test cache operations',
        };
      }
    }

    // Test 8: Sync Service (if company UUID provided)
    if ((testType === 'all' || testType === 'sync') && companyUuid) {
      console.log(`Testing sync service for company ${companyUuid}...`);
      try {
        const syncStatus = await serviceM8SyncService.getSyncStatus(companyUuid);
        results.tests.sync = {
          success: true,
          data: syncStatus,
          message: 'Sync status retrieved successfully',
        };
      } catch (error) {
        results.tests.sync = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to get sync status',
        };
      }
    }

    // Calculate overall success
    const testResults = Object.values(results.tests);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const successCount = testResults.filter((test: any) => test.success).length;
    const totalTests = testResults.length;
    
    results.summary = {
      totalTests,
      successfulTests: successCount,
      failedTests: totalTests - successCount,
      overallSuccess: successCount === totalTests,
      successRate: `${Math.round((successCount / totalTests) * 100)}%`,
    };

    return NextResponse.json({
      success: results.summary.overallSuccess,
      data: results,
      message: `Integration test completed: ${results.summary.successRate} success rate`,
    });

  } catch (error) {
    console.error('ServiceM8 integration test failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Integration test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: results,
      },
      { status: 500 }
    );
  }
}

/**
 * Run specific integration tests
 */
export async function POST(request: NextRequest) {
  try {
    const { testType, companyUuid, options = {} } = await request.json();

    switch (testType) {
      case 'sync_companies':
        const companiesStatus = await serviceM8SyncService.syncCompanies();
        return NextResponse.json({
          success: true,
          data: companiesStatus,
          message: `Companies sync test completed: ${companiesStatus.syncedRecords} synced`,
        });

      case 'sync_jobs':
        if (!companyUuid) {
          return NextResponse.json(
            { success: false, error: 'Company UUID is required for jobs sync test' },
            { status: 400 }
          );
        }
        
        const jobsStatus = await serviceM8SyncService.syncJobsForCompany(
          companyUuid, 
          { limit: 10, ...options } // Limit for testing
        );
        return NextResponse.json({
          success: true,
          data: jobsStatus,
          message: `Jobs sync test completed: ${jobsStatus.syncedRecords} synced`,
        });

      case 'sync_quotes':
        if (!companyUuid) {
          return NextResponse.json(
            { success: false, error: 'Company UUID is required for quotes sync test' },
            { status: 400 }
          );
        }
        
        const quotesStatus = await serviceM8SyncService.syncQuotesForCompany(
          companyUuid, 
          { limit: 10, ...options } // Limit for testing
        );
        return NextResponse.json({
          success: true,
          data: quotesStatus,
          message: `Quotes sync test completed: ${quotesStatus.syncedRecords} synced`,
        });

      case 'full_sync_test':
        const fullSyncStatus = await serviceM8SyncService.performFullSync();
        return NextResponse.json({
          success: true,
          data: fullSyncStatus,
          message: 'Full sync test completed',
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid test type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('ServiceM8 integration test failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Integration test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
