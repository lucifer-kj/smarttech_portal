import { NextRequest, NextResponse } from 'next/server';
import { serviceM8Client } from '@/services/servicem8-client';

/**
 * ServiceM8 Data API Routes
 * Handles fetching data from ServiceM8 API
 */

/**
 * Get jobs for a company
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyUuid = searchParams.get('company_uuid');
    const includeActivities = searchParams.get('include_activities') === 'true';
    const includeAttachments = searchParams.get('include_attachments') === 'true';
    const includeMaterials = searchParams.get('include_materials') === 'true';
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!companyUuid) {
      return NextResponse.json(
        { success: false, error: 'Company UUID is required' },
        { status: 400 }
      );
    }

    const options = {
      includeActivities,
      includeAttachments,
      includeMaterials,
      status: status ? [status as 'Quote' | 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'On Hold'] : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };

    const response = await serviceM8Client.getJobs(companyUuid, options);
    
    return NextResponse.json({
      success: true,
      data: response.data,
      meta: response.meta,
      message: `Retrieved ${response.data.length} jobs`
    });
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch jobs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get quotes for a company
 */
export async function POST(request: NextRequest) {
  try {
    const { companyUuid, options = {} } = await request.json();

    if (!companyUuid) {
      return NextResponse.json(
        { success: false, error: 'Company UUID is required' },
        { status: 400 }
      );
    }

    const response = await serviceM8Client.getQuotes(companyUuid, options);
    
    return NextResponse.json({
      success: true,
      data: response.data,
      meta: response.meta,
      message: `Retrieved ${response.data.length} quotes`
    });
  } catch (error) {
    console.error('Failed to fetch quotes:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch quotes',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
