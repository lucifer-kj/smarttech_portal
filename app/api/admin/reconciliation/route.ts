import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

/**
 * Manual Reconciliation API
 * Handles manual data synchronization triggers
 */
export async function POST(request: NextRequest) {
  const { type } = await request.json();
  const supabase = createAdminClient();

  if (!type || !['full', 'incremental', 'emergency'].includes(type)) {
    return NextResponse.json(
      { success: false, error: 'Invalid reconciliation type' },
      { status: 400 }
    );
  }

  try {
    // Create reconciliation record
    const reconciliationId = `recon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reconciliation, error } = await (supabase as any)
      .from('reconciliation_logs')
      .insert({
        id: reconciliationId,
        type: type as "full" | "incremental" | "emergency",
        status: 'running',
        started_at: new Date().toISOString(),
        records_processed: 0,
        errors: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create reconciliation record: ${error.message}`);
    }

    // Start reconciliation process (async)
    startReconciliationProcess(reconciliationId, type, supabase);

    // Log the action
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('audit_logs')
      .insert({
        actor_user_id: 'system', // TODO: Get from auth context
        action: 'reconciliation_started',
        target_type: 'system',
        target_id: reconciliationId,
        metadata: { type, reconciliationId },
        timestamp: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      data: reconciliation,
      message: `${type} reconciliation started successfully`
    });

  } catch (error) {
    console.error('Reconciliation start failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to start reconciliation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get reconciliation status
 */
/**
 * Start reconciliation process (async)
 */
async function startReconciliationProcess(reconciliationId: string, type: string, supabase: ReturnType<typeof createAdminClient>) {
  try {
    const startTime = Date.now();
    let recordsProcessed = 0;
    const errors = 0;

    // Simulate reconciliation process
    switch (type) {
      case 'incremental':
        recordsProcessed = await performIncrementalSync();
        break;
      case 'full':
        recordsProcessed = await performFullSync();
        break;
      case 'emergency':
        recordsProcessed = await performEmergencySync();
        break;
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Update reconciliation record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('reconciliation_logs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        records_processed: recordsProcessed,
        errors,
        duration,
      })
      .eq('id', reconciliationId);

    // Log completion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('audit_logs')
      .insert({
        actor_user_id: 'system',
        action: 'reconciliation_completed',
        target_type: 'system',
        target_id: reconciliationId,
        metadata: { 
          type, 
          recordsProcessed, 
          errors, 
          duration 
        },
        timestamp: new Date().toISOString(),
      });

  } catch (error) {
    console.error('Reconciliation process failed:', error);
    
    // Update reconciliation record with error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('reconciliation_logs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        errors: 1,
      })
      .eq('id', reconciliationId);

    // Log failure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('audit_logs')
      .insert({
        actor_user_id: 'system',
        action: 'reconciliation_failed',
        target_type: 'system',
        target_id: reconciliationId,
        metadata: { 
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString(),
      });
  }
}

/**
 * Perform incremental sync
 */
async function performIncrementalSync(): Promise<number> {
  // Simulate incremental sync
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Sync recent changes from ServiceM8
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/servicem8/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'incremental' }),
  });

  if (!response.ok) {
    throw new Error('Incremental sync failed');
  }

  return 150; // Simulated record count
}

/**
 * Perform full sync
 */
async function performFullSync(): Promise<number> {
  // Simulate full sync
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Sync all data from ServiceM8
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/servicem8/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'full' }),
  });

  if (!response.ok) {
    throw new Error('Full sync failed');
  }

  return 2500; // Simulated record count
}

/**
 * Perform emergency sync
 */
async function performEmergencySync(): Promise<number> {
  // Simulate emergency sync
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Force sync with conflict resolution
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/servicem8/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'emergency', force: true }),
  });

  if (!response.ok) {
    throw new Error('Emergency sync failed');
  }

  return 800; // Simulated record count
}
