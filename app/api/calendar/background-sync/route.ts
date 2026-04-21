import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/utils/auth';

/**
 * GET /api/calendar/background-sync
 * Background sync job for all users with Google Calendar connected
 *
 * This endpoint should be called periodically (e.g., every 15 minutes) via:
 * - Vercel Cron Jobs (vercel.json)
 * - External cron service (cron-job.org, etc.)
 * - Scheduled functions in other platforms
 *
 * Security: Requires CRON_SECRET header to prevent unauthorized access
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Get all users with Google Calendar sync enabled
    // (users who have sync token stored)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, google_calendar_sync_token, google_calendar_last_sync')
      .not('google_calendar_sync_token', 'is', null);

    if (usersError) {
      throw usersError;
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        message: 'No users with Google Calendar sync enabled',
        synced: 0,
      });
    }

    const results = {
      total: users.length,
      synced: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Sync each user's calendar
    for (const user of users) {
      try {
        // Trigger incremental sync for this user
        // Note: This approach works but isn't ideal for production
        // Better approach: Use a job queue (BullMQ, Inngest, etc.)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/sync`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Pass user context (in production, use service role)
              'X-User-ID': user.id,
            },
            body: JSON.stringify({
              syncType: 'incremental',
              userId: user.id,
            }),
          }
        );

        if (response.ok) {
          results.synced++;
        } else {
          results.failed++;
          results.errors.push({
            user_id: user.id,
            email: user.email,
            error: await response.text(),
          });
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          user_id: user.id,
          email: user.email,
          error: error.message,
        });
      }
    }

    // Log background sync results
    console.log('Background calendar sync completed:', results);

    return NextResponse.json({
      message: 'Background sync completed',
      results,
    });
  } catch (error: any) {
    console.error('Error in background sync:', error);
    return NextResponse.json(
      { error: error.message || 'Background sync failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar/background-sync
 * Trigger background sync manually (admin only)
 */
export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!isAdmin(userData?.role)) {
      return NextResponse.json(
        { error: 'Only admins can trigger background sync' },
        { status: 403 }
      );
    }

    // Trigger background sync by calling GET endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/background-sync`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      }
    );

    const data = await response.json();

    return NextResponse.json({
      message: 'Background sync triggered',
      ...data,
    });
  } catch (error: any) {
    console.error('Error triggering background sync:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to trigger background sync' },
      { status: 500 }
    );
  }
}
