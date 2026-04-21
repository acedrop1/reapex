import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getGoogleCalendarClient,
  fetchAllGoogleEvents,
  fetchIncrementalGoogleEvents,
  googleEventToReapex,
  reapexEventToGoogle,
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
  detectConflict,
  resolveConflictLastWriteWins,
  logSyncOperation,
  storeSyncConflict,
  SyncResult,
  SyncConflict,
  ReapexCalendarEvent,
} from '@/lib/google-calendar';

/**
 * POST /api/calendar/sync
 * Perform bidirectional calendar sync between Google Calendar and Reapex
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get sync type from request body
    const { syncType = 'full', forceFullSync = false } = await request.json();

    // Get OAuth tokens from session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.provider_token || !session?.provider_refresh_token) {
      return NextResponse.json(
        { error: 'Google Calendar access not authorized. Please sign in again.' },
        { status: 401 }
      );
    }

    // Initialize Google Calendar client
    const calendar = await getGoogleCalendarClient(
      session.provider_token,
      session.provider_refresh_token
    );

    // Get user's sync token for incremental sync
    const { data: userData } = await supabase
      .from('users')
      .select('google_calendar_sync_token, google_calendar_last_sync')
      .eq('id', user.id)
      .single();

    const syncToken = userData?.google_calendar_sync_token;
    const lastSync = userData?.google_calendar_last_sync;
    const useIncrementalSync =
      !forceFullSync && syncType === 'incremental' && syncToken && lastSync;

    // Sync result tracking
    const result: SyncResult = {
      success: false,
      events_synced: 0,
      events_created: 0,
      events_updated: 0,
      events_deleted: 0,
      conflicts: [],
    };

    try {
      // Step 1: Fetch Google Calendar events
      let googleEvents;
      let newSyncToken = syncToken;

      if (useIncrementalSync) {
        try {
          const incrementalResult = await fetchIncrementalGoogleEvents(calendar, syncToken!);
          googleEvents = incrementalResult.events;
          newSyncToken = incrementalResult.nextSyncToken;
        } catch (error: any) {
          if (error.message === 'SYNC_TOKEN_INVALID') {
            // Fall back to full sync
            googleEvents = await fetchAllGoogleEvents(calendar);
            newSyncToken = null;
          } else {
            throw error;
          }
        }
      } else {
        // Full sync - fetch all events (past + future)
        googleEvents = await fetchAllGoogleEvents(calendar);
      }

      // Step 2: Sync Google → Reapex (import Google events)
      for (const googleEvent of googleEvents) {
        if (!googleEvent.id || !googleEvent.start) continue;

        // Check if event already exists in Reapex
        const { data: existingEvent } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('google_event_id', googleEvent.id)
          .eq('agent_id', user.id)
          .single();

        if (googleEvent.status === 'cancelled') {
          // Event was deleted in Google Calendar
          if (existingEvent) {
            await supabase
              .from('calendar_events')
              .delete()
              .eq('id', existingEvent.id);
            result.events_deleted++;
          }
          continue;
        }

        if (existingEvent) {
          // Check for conflicts
          const conflict = detectConflict(existingEvent, googleEvent);
          if (conflict) {
            const resolution = resolveConflictLastWriteWins(existingEvent, googleEvent);

            if (resolution === 'keep_google') {
              // Update Reapex with Google data
              const reapexEvent = googleEventToReapex(googleEvent, user.id);
              await supabase
                .from('calendar_events')
                .update({
                  ...reapexEvent,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingEvent.id);
              result.events_updated++;
            } else {
              // Keep Reapex data, but log conflict
              await storeSyncConflict(user.id, conflict);
              result.conflicts.push(conflict);
            }
          } else {
            // No conflict, update if Google is newer
            const googleUpdated = new Date(googleEvent.updated!);
            const reapexUpdated = new Date(existingEvent.updated_at || existingEvent.created_at!);

            if (googleUpdated > reapexUpdated) {
              const reapexEvent = googleEventToReapex(googleEvent, user.id);
              await supabase
                .from('calendar_events')
                .update({
                  ...reapexEvent,
                  event_category: existingEvent.event_category, // Preserve user's category
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingEvent.id);
              result.events_updated++;
            }
          }
        } else {
          // New event from Google Calendar
          const reapexEvent = googleEventToReapex(googleEvent, user.id);
          await supabase.from('calendar_events').insert(reapexEvent);
          result.events_created++;
        }

        result.events_synced++;
      }

      // Step 3: Sync Reapex → Google (export Reapex events)
      // Get all Reapex events modified since last sync
      const reapexQuery = supabase
        .from('calendar_events')
        .select('*')
        .eq('agent_id', user.id);

      if (lastSync && useIncrementalSync) {
        reapexQuery.gte('updated_at', lastSync);
      }

      const { data: reapexEvents } = await reapexQuery;

      for (const reapexEvent of reapexEvents || []) {
        if (reapexEvent.google_event_id) {
          // Event already synced to Google, check if needs update
          try {
            const googleEventData = reapexEventToGoogle(reapexEvent);
            await updateGoogleEvent(calendar, reapexEvent.google_event_id, {
              ...reapexEvent,
              ...googleEventData,
            });

            // Update last_synced_at
            await supabase
              .from('calendar_events')
              .update({ last_synced_at: new Date().toISOString() })
              .eq('id', reapexEvent.id);
          } catch (error: any) {
            if (error.code === 404) {
              // Event deleted in Google, create new one
              const newGoogleEvent = await createGoogleEvent(calendar, reapexEvent);
              await supabase
                .from('calendar_events')
                .update({
                  google_event_id: newGoogleEvent.id,
                  last_synced_at: new Date().toISOString(),
                })
                .eq('id', reapexEvent.id);
              result.events_created++;
            } else {
              console.error('Error updating Google event:', error);
            }
          }
        } else {
          // New Reapex event, create in Google Calendar
          try {
            const newGoogleEvent = await createGoogleEvent(calendar, reapexEvent);
            await supabase
              .from('calendar_events')
              .update({
                google_event_id: newGoogleEvent.id,
                last_synced_at: new Date().toISOString(),
              })
              .eq('id', reapexEvent.id);
            result.events_created++;
          } catch (error) {
            console.error('Error creating Google event:', error);
          }
        }
      }

      // Step 4: Update sync metadata
      await supabase
        .from('users')
        .update({
          google_calendar_sync_token: newSyncToken,
          google_calendar_last_sync: new Date().toISOString(),
        })
        .eq('id', user.id);

      result.success = true;

      // Log sync operation
      await logSyncOperation(user.id, syncType as any, 'bidirectional', result);

      return NextResponse.json({
        success: true,
        message: 'Calendar synced successfully',
        result,
      });
    } catch (error: any) {
      result.error = error.message;
      await logSyncOperation(user.id, syncType as any, 'bidirectional', result);
      throw error;
    }
  } catch (error: any) {
    console.error('Error syncing calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync calendar' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calendar/sync/status
 * Get current sync status for the user
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

    // Get user's sync metadata
    const { data: userData } = await supabase
      .from('users')
      .select('google_calendar_sync_token, google_calendar_last_sync')
      .eq('id', user.id)
      .single();

    // Get last sync log
    const { data: lastSyncLog } = await supabase
      .from('calendar_sync_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get unresolved conflicts count
    const { count: conflictsCount } = await supabase
      .from('calendar_sync_conflicts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('resolved', false);

    return NextResponse.json({
      lastSync: userData?.google_calendar_last_sync || null,
      hasSyncToken: !!userData?.google_calendar_sync_token,
      lastSyncLog,
      unresolvedConflicts: conflictsCount || 0,
    });
  } catch (error: any) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
