import { NextRequest, NextResponse } from 'next/server';
import { serviceM8Client } from '@/services/servicem8-client';

/**
 * ServiceM8 Quote Management API Routes
 * Handles quote approval and rejection
 */

/**
 * Approve a quote
 */
export async function POST(request: NextRequest) {
  try {
    const { jobUuid, approvedLineItems, clientNotes } = await request.json();

    if (!jobUuid) {
      return NextResponse.json(
        { success: false, error: 'Job UUID is required' },
        { status: 400 }
      );
    }

    const approvedJob = await serviceM8Client.approveQuote(
      jobUuid,
      approvedLineItems,
      clientNotes
    );
    
    return NextResponse.json({
      success: true,
      data: approvedJob,
      message: 'Quote approved successfully'
    });
  } catch (error) {
    console.error('Failed to approve quote:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to approve quote',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Reject a quote
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobUuid = searchParams.get('job_uuid');
    const reason = searchParams.get('reason');

    if (!jobUuid) {
      return NextResponse.json(
        { success: false, error: 'Job UUID is required' },
        { status: 400 }
      );
    }

    const rejectedJob = await serviceM8Client.rejectQuote(jobUuid, reason || undefined);
    
    return NextResponse.json({
      success: true,
      data: rejectedJob,
      message: 'Quote rejected successfully'
    });
  } catch (error) {
    console.error('Failed to reject quote:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reject quote',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
