import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/utils/auth';
import { Resend } from 'resend';

function generateSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

function buildWelcomeEmail(fullName: string, email: string, password: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Reapex</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
          <tr>
            <td style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%);padding:40px 40px 30px;text-align:center;border-bottom:2px solid #d4af37;">
              <h1 style="margin:0;font-size:32px;font-weight:700;color:#d4af37;letter-spacing:1px;">REAPEX</h1>
              <p style="margin:8px 0 0;font-size:13px;color:#999;letter-spacing:3px;text-transform:uppercase;">Real Estate Elevated</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 20px;font-size:24px;color:#ffffff;font-weight:600;">Welcome aboard, ${fullName}!</h2>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#cccccc;">Your agent account has been created. Below are your login credentials to access the Reapex Agent Portal.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#141414;border:1px solid rgba(212,175,55,0.2);border-radius:8px;margin:24px 0;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Email</p>
                    <p style="margin:0 0 20px;font-size:16px;color:#ffffff;font-weight:500;">${email}</p>
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Temporary Password</p>
                    <p style="margin:0;font-size:18px;color:#d4af37;font-weight:600;font-family:monospace;letter-spacing:1px;">${password}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#ff9800;font-weight:500;">You will be asked to set a new password when you first log in.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="https://re-apex.com/login" style="display:inline-block;background-color:#d4af37;color:#0a0a0a;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:6px;letter-spacing:0.5px;">Sign In to Your Portal</a>
                  </td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid #2a2a2a;margin:24px 0;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#666;">If you have any questions, reach out to us at <a href="mailto:admin@re-apex.com" style="color:#d4af37;text-decoration:none;">admin@re-apex.com</a>.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#080808;padding:24px 40px;text-align:center;border-top:1px solid #1a1a1a;">
              <p style="margin:0 0 8px;font-size:14px;color:#d4af37;font-weight:600;">Reapex</p>
              <p style="margin:0;font-size:12px;color:#666;">260 Columbia Ave, Suite 20, Fort Lee, NJ 07024</p>
              <p style="margin:8px 0 0;font-size:11px;color:#444;">&copy; ${new Date().getFullYear()} Reapex - All rights reserved</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Helper function to verify admin role (admin or broker)
async function verifyAdminAccess(supabase: any, userId: string) {
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  return userProfile && isAdmin(userProfile.role);
}

// POST - Create new user manually
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
    const isAdmin = await verifyAdminAccess(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, full_name, role, account_status } = body;

    console.log('[Create User] Request:', { email, full_name, role, account_status });

    // Validate required fields
    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    // Create service role client for admin operations (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create auth user using Supabase Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for manually created users
      user_metadata: {
        full_name,
      },
    });

    if (authError) {
      console.error('[Create User] Auth error:', authError);
      // Show the actual Supabase error message to the admin
      let friendlyMessage = authError.message;
      if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
        friendlyMessage = `A user with email "${email}" already exists in the system.`;
      }
      return NextResponse.json({
        error: friendlyMessage,
        details: authError.message,
        code: authError.code
      }, { status: 400 });
    }

    // Generate a URL slug for the agent's public profile
    const slug = generateSlug(full_name);

    // First, try to create or update the user profile directly
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authData.user.id,
        email,
        full_name,
        role: role || 'agent',
        account_status: account_status || 'approved',
        approved_by: account_status === 'approved' ? user.id : null,
        approved_at: account_status === 'approved' ? new Date().toISOString() : null,
        cap_amount: 0,
        current_cap_progress: 0,
        slug,
        display_order: 0,
        hide_from_listing: (role || 'agent') === 'admin' ? true : false,
        must_change_password: true,
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (userError) {
      console.error('[Create User] Profile upsert error:', userError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({
        error: 'Database error creating user profile',
        details: userError.message,
        code: userError.code
      }, { status: 400 });
    }

    if (!userData) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
    }

    // Send welcome email via Resend
    let emailSent = false;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: 'Reapex <noreply@re-apex.com>',
          to: email,
          subject: 'Welcome to Reapex - Your Account is Ready',
          html: buildWelcomeEmail(full_name, email, password),
        });
        emailSent = true;
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
      }
    } else {
      console.warn('RESEND_API_KEY not set - welcome email not sent');
    }

    return NextResponse.json({
      data: userData,
      emailSent,
      tempPassword: emailSent ? undefined : password,
      message: emailSent
        ? 'Agent created and welcome email sent'
        : 'Agent created but email could not be sent. Temporary password is included.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update user account status (approve/reject/suspend)
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
    const isAdmin = await verifyAdminAccess(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, account_status } = body;

    if (!userId || !account_status) {
      return NextResponse.json(
        { error: 'User ID and account status are required' },
        { status: 400 }
      );
    }

    // Validate account_status
    const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
    if (!validStatuses.includes(account_status)) {
      return NextResponse.json(
        { error: 'Invalid account status' },
        { status: 400 }
      );
    }

    // Create service role client for admin operations (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Update user account status (using service role to bypass RLS)
    const updateData: any = {
      account_status,
    };

    // Set approved_by and approved_at only when approving
    if (account_status === 'approved') {
      updateData.approved_by = user.id;
      updateData.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
