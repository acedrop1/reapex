import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/utils/auth';

/**
 * GET /api/admin/workspace-users
 * Fetches users from Google Workspace Directory API
 * Requires GOOGLE_WORKSPACE_CUSTOMER_ID and service account credentials
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!isAdmin(profile?.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Check for required environment variables
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    const customerId = process.env.GOOGLE_WORKSPACE_CUSTOMER_ID || 'my_customer';

    if (!serviceAccountEmail || !serviceAccountKey) {
      return NextResponse.json({
        error: 'Google Workspace API not configured. Please contact system administrator.',
        details: 'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variables',
        userFriendly: true
      }, { status: 503 });
    }

    // Import Google Auth library dynamically
    const { google } = await import('googleapis');
    const { JWT } = await import('google-auth-library');

    // Create JWT client with service account credentials
    const auth = new JWT({
      email: serviceAccountEmail,
      key: serviceAccountKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
      subject: process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL, // Must be a workspace admin
    });

    // Initialize Directory API
    const directory = google.admin({ version: 'directory_v1', auth });

    // Fetch users from workspace
    const response = await directory.users.list({
      customer: customerId,
      domain: 're-apex.com', // Only fetch @re-apex.com users
      maxResults: 500, // Adjust as needed
      orderBy: 'email',
      query: 'isSuspended=false', // Only active users
    });

    const workspaceUsers = response.data.users || [];

    // Check which users already exist in our system
    const emails = workspaceUsers.map(u => u.primaryEmail).filter(Boolean);
    const { data: existingUsers } = await supabase
      .from('users')
      .select('email')
      .in('email', emails);

    const existingEmails = new Set(existingUsers?.map(u => u.email) || []);

    // Format users for frontend
    const users = workspaceUsers.map(user => ({
      id: user.id,
      email: user.primaryEmail,
      fullName: user.name?.fullName || '',
      givenName: user.name?.givenName || '',
      familyName: user.name?.familyName || '',
      photoUrl: user.thumbnailPhotoUrl,
      isAdmin: user.isAdmin || false,
      orgUnitPath: user.orgUnitPath || '/',
      alreadyExists: existingEmails.has(user.primaryEmail || ''),
    }));

    return NextResponse.json({
      users,
      total: users.length,
      newUsers: users.filter(u => !u.alreadyExists).length,
    });

  } catch (error: any) {
    console.error('[Workspace Users API] Error:', error);

    // Handle specific Google API errors
    if (error.code === 403) {
      return NextResponse.json({
        error: 'Access denied to Google Workspace Directory',
        details: 'Service account may not have proper domain delegation or the admin email may be incorrect',
        userFriendly: true
      }, { status: 403 });
    }

    if (error.code === 401) {
      return NextResponse.json({
        error: 'Invalid Google Workspace credentials',
        details: 'Service account credentials may be invalid or expired',
        userFriendly: true
      }, { status: 401 });
    }

    return NextResponse.json({
      error: error.message || 'Failed to fetch workspace users',
      userFriendly: true
    }, { status: 500 });
  }
}
