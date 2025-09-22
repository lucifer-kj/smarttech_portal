import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

/**
 * Individual User Management API
 * Handles ban/unban, magic link generation, and user updates
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { action } = await request.json();
  const supabase = createAdminClient();

  try {
    switch (action) {
      case 'ban':
        return await banUser(userId, supabase);
      case 'unban':
        return await unbanUser(userId, supabase);
      case 'send_magic_link':
        return await sendMagicLink(userId, supabase);
      case 'update':
        return await updateUser(userId, request, supabase);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('User action failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'User action failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Ban a user
 */
async function banUser(userId: string, supabase: ReturnType<typeof createAdminClient>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('users')
    .update({ is_banned: true, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to ban user: ${error.message}`);
  }

  // Log the action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('audit_logs')
    .insert({
      actor_user_id: 'system', // TODO: Get from auth context
      action: 'user_banned',
      target_type: 'user',
      target_id: userId,
      metadata: { reason: 'Admin action' },
      timestamp: new Date().toISOString(),
    });

  return NextResponse.json({
    success: true,
    message: 'User banned successfully'
  });
}

/**
 * Unban a user
 */
async function unbanUser(userId: string, supabase: ReturnType<typeof createAdminClient>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('users')
    .update({ is_banned: false, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to unban user: ${error.message}`);
  }

  // Log the action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('audit_logs')
    .insert({
      actor_user_id: 'system', // TODO: Get from auth context
      action: 'user_unbanned',
      target_type: 'user',
      target_id: userId,
      metadata: { reason: 'Admin action' },
      timestamp: new Date().toISOString(),
    });

  return NextResponse.json({
    success: true,
    message: 'User unbanned successfully'
  });
}

/**
 * Send magic link to user
 */
async function sendMagicLink(userId: string, supabase: ReturnType<typeof createAdminClient>) {
  // Get user details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: user, error: userError } = await (supabase as any)
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new Error('User not found');
  }

  // Send magic link via API
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/magic-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email }),
  });

  if (!response.ok) {
    throw new Error('Failed to send magic link');
  }

  // Log the action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('audit_logs')
    .insert({
      actor_user_id: 'system', // TODO: Get from auth context
      action: 'magic_link_sent',
      target_type: 'user',
      target_id: userId,
      metadata: { email: user.email },
      timestamp: new Date().toISOString(),
    });

  return NextResponse.json({
    success: true,
    message: 'Magic link sent successfully'
  });
}

/**
 * Update user details
 */
async function updateUser(userId: string, request: NextRequest, supabase: ReturnType<typeof createAdminClient>) {
  const { email, role, sm8_uuid } = await request.json();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (sm8_uuid !== undefined) updateData.sm8_uuid = sm8_uuid;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  // Log the action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('audit_logs')
    .insert({
      actor_user_id: 'system', // TODO: Get from auth context
      action: 'user_updated',
      target_type: 'user',
      target_id: userId,
      metadata: updateData,
      timestamp: new Date().toISOString(),
    });

  return NextResponse.json({
    success: true,
    message: 'User updated successfully'
  });
}
