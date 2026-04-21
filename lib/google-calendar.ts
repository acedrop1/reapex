/**
 * Google Calendar API Helper Library
 *
 * Provides utilities for bidirectional sync between Google Calendar and Reapex Calendar
 */

import { google, calendar_v3 } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  updated?: string;
  status?: string;
  htmlLink?: string;
  colorId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ReapexCalendarEvent {
  id: string;
  agent_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  event_type: 'task' | 'appointment' | 'transaction' | 'company';
  source: 'task' | 'transaction' | 'custom' | 'deal';
  source_id?: string;
  google_event_id?: string;
  event_category?: string;
  last_synced_at?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  google_metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface SyncResult {
  success: boolean;
  events_synced: number;
  events_created: number;
  events_updated: number;
  events_deleted: number;
  conflicts: SyncConflict[];
  error?: string;
}

export interface SyncConflict {
  event_id?: string;
  google_event_id: string;
  conflict_type: 'update_collision' | 'delete_collision' | 'duplicate';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reapex_data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  google_data: any;
}

/**
 * Initialize Google Calendar API client with OAuth tokens
 */
export async function getGoogleCalendarClient(accessToken: string, refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_SUPABASE_URL, // Client ID (from Supabase OAuth)
    process.env.SUPABASE_SERVICE_ROLE_KEY, // Client Secret
    `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Handle token refresh automatically
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      // Store new refresh token if provided
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Update user metadata with new tokens
        await supabase.auth.updateUser({
          data: {
            provider_token: tokens.access_token,
            provider_refresh_token: tokens.refresh_token,
          },
        });
      }
    }
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Fetch all events from Google Calendar (full sync)
 */
export async function fetchAllGoogleEvents(
  calendar: calendar_v3.Calendar,
  options: {
    timeMin?: Date;
    timeMax?: Date;
    maxResults?: number;
  } = {}
): Promise<GoogleCalendarEvent[]> {
  const allEvents: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined = undefined;

  try {
    do {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await calendar.events.list({
        calendarId: 'primary',
        timeMin: options.timeMin?.toISOString(),
        timeMax: options.timeMax?.toISOString(),
        maxResults: options.maxResults || 250,
        singleEvents: true,
        orderBy: 'startTime',
        pageToken: pageToken,
      });

      if (response.data.items) {
        allEvents.push(...(response.data.items as GoogleCalendarEvent[]));
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    return allEvents;
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    throw error;
  }
}

/**
 * Fetch incremental changes from Google Calendar using sync token
 */
export async function fetchIncrementalGoogleEvents(
  calendar: calendar_v3.Calendar,
  syncToken: string
): Promise<{ events: GoogleCalendarEvent[]; nextSyncToken: string }> {
  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      syncToken: syncToken,
      maxResults: 250,
      singleEvents: true,
    });

    return {
      events: (response.data.items || []) as GoogleCalendarEvent[],
      nextSyncToken: response.data.nextSyncToken || syncToken,
    };
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    // If sync token is invalid (410 error), need to do full sync
    if (error.code === 410) {
      throw new Error('SYNC_TOKEN_INVALID');
    }
    throw error;
  }
}

/**
 * Create a new event in Google Calendar
 */
export async function createGoogleEvent(
  calendar: calendar_v3.Calendar,
  event: Partial<ReapexCalendarEvent>
): Promise<GoogleCalendarEvent> {
  try {
    const googleEvent: calendar_v3.Schema$Event = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.start_date,
        timeZone: 'America/New_York', // TODO: Make configurable
      },
      end: {
        dateTime: event.end_date || event.start_date,
        timeZone: 'America/New_York',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: googleEvent,
    });

    return response.data as GoogleCalendarEvent;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
}

/**
 * Update an existing event in Google Calendar
 */
export async function updateGoogleEvent(
  calendar: calendar_v3.Calendar,
  googleEventId: string,
  event: Partial<ReapexCalendarEvent>
): Promise<GoogleCalendarEvent> {
  try {
    const googleEvent: calendar_v3.Schema$Event = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.start_date,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: event.end_date || event.start_date,
        timeZone: 'America/New_York',
      },
    };

    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: googleEventId,
      requestBody: googleEvent,
    });

    return response.data as GoogleCalendarEvent;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    throw error;
  }
}

/**
 * Delete an event from Google Calendar
 */
export async function deleteGoogleEvent(
  calendar: calendar_v3.Calendar,
  googleEventId: string
): Promise<void> {
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    });
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    throw error;
  }
}

/**
 * Convert Google Calendar event to Reapex calendar event format
 */
export function googleEventToReapex(
  googleEvent: GoogleCalendarEvent,
  agentId: string
): Partial<ReapexCalendarEvent> {
  const startDate = googleEvent.start.dateTime || googleEvent.start.date;
  const endDate = googleEvent.end?.dateTime || googleEvent.end?.date;

  return {
    agent_id: agentId,
    title: googleEvent.summary || 'Untitled Event',
    description: googleEvent.description,
    start_date: startDate!,
    end_date: endDate,
    event_type: 'appointment', // Default type
    source: 'custom', // Default source
    google_event_id: googleEvent.id,
    last_synced_at: new Date().toISOString(),
    google_metadata: {
      htmlLink: googleEvent.htmlLink,
      colorId: googleEvent.colorId,
      status: googleEvent.status,
      updated: googleEvent.updated,
    },
  };
}

/**
 * Convert Reapex calendar event to Google Calendar event format
 */
export function reapexEventToGoogle(
  reapexEvent: ReapexCalendarEvent
): calendar_v3.Schema$Event {
  return {
    summary: reapexEvent.title,
    description: reapexEvent.description,
    start: {
      dateTime: reapexEvent.start_date,
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: reapexEvent.end_date || reapexEvent.start_date,
      timeZone: 'America/New_York',
    },
  };
}

/**
 * Detect sync conflicts based on timestamps
 */
export function detectConflict(
  reapexEvent: ReapexCalendarEvent,
  googleEvent: GoogleCalendarEvent
): SyncConflict | null {
  const reapexUpdated = new Date(reapexEvent.updated_at || reapexEvent.created_at!);
  const googleUpdated = new Date(googleEvent.updated!);
  const lastSynced = reapexEvent.last_synced_at ? new Date(reapexEvent.last_synced_at) : null;

  // If both updated after last sync, we have a conflict
  if (
    lastSynced &&
    reapexUpdated > lastSynced &&
    googleUpdated > lastSynced &&
    Math.abs(reapexUpdated.getTime() - googleUpdated.getTime()) > 60000 // >1 minute difference
  ) {
    return {
      event_id: reapexEvent.id,
      google_event_id: googleEvent.id,
      conflict_type: 'update_collision',
      reapex_data: reapexEvent,
      google_data: googleEvent,
    };
  }

  return null;
}

/**
 * Resolve sync conflict using "last write wins" strategy
 */
export function resolveConflictLastWriteWins(
  reapexEvent: ReapexCalendarEvent,
  googleEvent: GoogleCalendarEvent
): 'keep_reapex' | 'keep_google' {
  const reapexUpdated = new Date(reapexEvent.updated_at || reapexEvent.created_at!);
  const googleUpdated = new Date(googleEvent.updated!);

  return googleUpdated > reapexUpdated ? 'keep_google' : 'keep_reapex';
}

/**
 * Log sync operation to database
 */
export async function logSyncOperation(
  userId: string,
  syncType: 'full' | 'incremental' | 'manual' | 'webhook',
  syncDirection: 'google_to_reapex' | 'reapex_to_google' | 'bidirectional',
  result: SyncResult
) {
  const supabase = await createClient();

  await supabase.from('calendar_sync_log').insert({
    user_id: userId,
    sync_type: syncType,
    sync_direction: syncDirection,
    events_synced: result.events_synced,
    events_created: result.events_created,
    events_updated: result.events_updated,
    events_deleted: result.events_deleted,
    conflicts_detected: result.conflicts.length,
    sync_status: result.success ? 'success' : 'failed',
    error_message: result.error,
    sync_started_at: new Date().toISOString(),
    sync_completed_at: new Date().toISOString(),
  });
}

/**
 * Store sync conflict in database
 */
export async function storeSyncConflict(
  userId: string,
  conflict: SyncConflict
) {
  const supabase = await createClient();

  await supabase.from('calendar_sync_conflicts').insert({
    user_id: userId,
    event_id: conflict.event_id,
    google_event_id: conflict.google_event_id,
    conflict_type: conflict.conflict_type,
    reapex_data: conflict.reapex_data,
    google_data: conflict.google_data,
    resolved: false,
  });
}
