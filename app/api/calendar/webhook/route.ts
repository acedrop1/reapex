import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/utils/auth';

/**
 * POST /api/calendar/webhook
 * Handle Google Calendar push notifications
 *
 * Google Calendar sends notifications when events change.
 * This endpoint receives those notifications and triggers targeted sync.
 *
 * Setup required:
 * 1. Register webhook URL with Google Calendar API
 * 2. Set up channel with watch() API call
 * 3. Renew channels before expiration (max 30 days)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Google
    const channelId = request.headers.get('x-goog-channel-id');
    const channelToken = request.headers.get('x-goog-channel-token');
    const resourceState = request.headers.get('x-goog-resource-state');
    const resourceId = request.headers.get('x-goog-resource-id');

    if (!channelId || !resourceState) {
      return NextResponse.json({ error: 'Invalid webhook request' }, { status: 400 });
    }

    // Handle different resource states
    switch (resourceState) {
      case 'sync':
        // Initial sync verification message
        console.log('Google Calendar webhook sync verification received');
        return NextResponse.json({ success: true });

      case 'exists':
        // Calendar changes detected
        console.log('Google Calendar change notification received:', {
          channelId,
          resourceId,
        });

        // TODO: Extract user ID from channelToken
        // For now, we'll trigger a background sync for all users
        // In production, encode user ID in channelToken when setting up the watch

        // Trigger incremental sync via background job
        // This could be done via a queue system in production
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              syncType: 'incremental',
              // userId: extractedFromChannelToken,
            }),
          });

          if (!response.ok) {
            console.error('Failed to trigger sync from webhook:', await response.text());
          }
        } catch (error) {
          console.error('Error triggering sync from webhook:', error);
        }

        return NextResponse.json({ success: true });

      case 'not_exists':
        // Calendar deleted or access revoked
        console.log('Google Calendar access revoked or calendar deleted:', {
          channelId,
          resourceId,
        });
        return NextResponse.json({ success: true });

      default:
        console.log('Unknown resource state:', resourceState);
        return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error('Error handling calendar webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

/**
 * Setup Google Calendar push notifications
 * Call this endpoint to register webhook with Google Calendar
 */
export async function GET() {
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
        { error: 'Only admins can setup webhooks' },
        { status: 403 }
      );
    }

    // TODO: Implement webhook registration with Google Calendar API
    // This requires:
    // 1. Get OAuth tokens
    // 2. Call calendar.events.watch() API
    // 3. Store channel ID and expiration
    // 4. Set up renewal before expiration

    return NextResponse.json({
      message: 'Webhook setup not yet implemented',
      instructions: [
        '1. Use calendar.events.watch() API to register webhook',
        '2. Set webhook URL to /api/calendar/webhook',
        '3. Include user ID in channel token for identification',
        '4. Renew channel before expiration (max 30 days)',
      ],
    });
  } catch (error: any) {
    console.error('Error setting up webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to setup webhook' },
      { status: 500 }
    );
  }
}
