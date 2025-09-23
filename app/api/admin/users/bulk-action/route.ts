import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

/**
 * Bulk User Operations API
 * Handles bulk actions on multiple users
 */
export async function POST(request: NextRequest) {
  const { action, userIds } = await request.json();
  const supabase = createAdminClient();

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json(
      { success: false, error: 'User IDs array is required' },
      { status: 400 }
    );
  }

  try {
    switch (action) {
      case 'send_magic_links':
        return await bulkSendMagicLinks(userIds, supabase);
      case 'ban':
        return await bulkBanUsers(userIds, supabase);
      case 'unban':
        return await bulkUnbanUsers(userIds, supabase);
      case 'delete':
        return await bulkDeleteUsers(userIds, supabase);
      case 'export':
        return await bulkExportUsers(userIds, supabase);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid bulk action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Bulk operation failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Bulk operation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Bulk send magic links
 */
async function bulkSendMagicLinks(userIds: string[], supabase: ReturnType<typeof createAdminClient>) {
  let successCount = 0;
  let failureCount = 0;
  const errors: string[] = [];

  for (const userId of userIds) {
    try {
      // Get user email
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: user, error: userError } = await (supabase as any)
        .from('users')
        .select('email, role, is_banned')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        failureCount++;
        errors.push(`User ${userId} not found`);
        continue;
      }

      if (user.is_banned) {
        failureCount++;
        errors.push(`User ${userId} is banned`);
        continue;
      }

      // Send magic link
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email,
          appRedirect: user.role === 'admin' ? '/admin' : '/client'
        }),
      });

      if (response.ok) {
        successCount++;
        
        // Log the action
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('audit_logs')
          .insert({
            actor_user_id: 'system',
            action: 'bulk_magic_link_sent',
            target_type: 'user',
            target_id: userId,
            metadata: { email: user.email },
            timestamp: new Date().toISOString(),
          });
      } else {
        failureCount++;
        errors.push(`Failed to send magic link to ${user.email}`);
      }
    } catch (error) {
      failureCount++;
      errors.push(`Error processing user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      successCount,
      failureCount,
      totalProcessed: userIds.length,
      errors: errors.slice(0, 10), // Limit error messages
    },
    message: `Sent ${successCount} magic links successfully`
  });
}

/**
 * Bulk ban users
 */
async function bulkBanUsers(userIds: string[], supabase: ReturnType<typeof createAdminClient>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('users')
    .update({ 
      is_banned: true, 
      updated_at: new Date().toISOString() 
    })
    .in('id', userIds);

  if (error) {
    throw new Error(`Failed to ban users: ${error.message}`);
  }

  // Log the action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('audit_logs')
    .insert({
      actor_user_id: 'system',
      action: 'bulk_user_banned',
      target_type: 'users',
      target_id: 'bulk',
      metadata: { 
        userIds, 
        count: userIds.length,
        reason: 'Admin bulk action'
      },
      timestamp: new Date().toISOString(),
    });

  return NextResponse.json({
    success: true,
    data: { bannedCount: userIds.length },
    message: `Banned ${userIds.length} users successfully`
  });
}

/**
 * Bulk unban users
 */
async function bulkUnbanUsers(userIds: string[], supabase: ReturnType<typeof createAdminClient>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('users')
    .update({ 
      is_banned: false, 
      updated_at: new Date().toISOString() 
    })
    .in('id', userIds);

  if (error) {
    throw new Error(`Failed to unban users: ${error.message}`);
  }

  // Log the action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('audit_logs')
    .insert({
      actor_user_id: 'system',
      action: 'bulk_user_unbanned',
      target_type: 'users',
      target_id: 'bulk',
      metadata: { 
        userIds,
        count: userIds.length,
        reason: 'Admin bulk action'
      },
      timestamp: new Date().toISOString(),
    });

  return NextResponse.json({
    success: true,
    data: { unbannedCount: userIds.length },
    message: `Unbanned ${userIds.length} users successfully`
  });
}

/**
 * Bulk delete users
 */
async function bulkDeleteUsers(userIds: string[], supabase: ReturnType<typeof createAdminClient>) {
  const { error } = await supabase
    .from('users')
    .delete()
    .in('id', userIds);

  if (error) {
    throw new Error(`Failed to delete users: ${error.message}`);
  }

  // Log the action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('audit_logs')
    .insert({
      actor_user_id: 'system',
      action: 'bulk_user_deleted',
      target_type: 'users',
      target_id: 'bulk',
      metadata: { 
        userIds,
        count: userIds.length,
        reason: 'Admin bulk action'
      },
      timestamp: new Date().toISOString(),
    });

  return NextResponse.json({
    success: true,
    data: { deletedCount: userIds.length },
    message: `Deleted ${userIds.length} users successfully`
  });
}

/**
 * Bulk export users
 */
async function bulkExportUsers(userIds: string[], supabase: ReturnType<typeof createAdminClient>) {
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .in('id', userIds);

  if (error) {
    throw new Error(`Failed to export users: ${error.message}`);
  }

  // Log the action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('audit_logs')
    .insert({
      actor_user_id: 'system',
      action: 'bulk_user_exported',
      target_type: 'users',
      target_id: 'bulk',
      metadata: { 
        userIds,
        count: users.length,
        format: 'json'
      },
      timestamp: new Date().toISOString(),
    });

  return NextResponse.json({
    success: true,
    data: { 
      users,
      exportedCount: users.length,
      format: 'json'
    },
    message: `Exported ${users.length} users successfully`
  });
}
