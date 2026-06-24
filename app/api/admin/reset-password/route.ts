import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/utils/auth';
import { Resend } from 'resend';

// Helper function to verify admin role
async function verifyAdminAccess(supabase: any, userId: string) {
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  return userProfile && isAdmin(userProfile.role);
}

function buildPasswordResetEmail(fullName: string, resetLink: string): string {
  const firstName = fullName.split(' ')[0];
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Reapex</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.15);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%);padding:40px 40px 30px;text-align:center;border-bottom:2px solid #d4af37;">
              <img src="https://www.re-apex.com/images/reapex-logo-email.png" alt="Reapex" width="200" style="display:block;margin:0 auto 8px;max-width:200px;height:auto;" />
              <p style="margin:8px 0 0;font-size:13px;color:#999;letter-spacing:3px;text-transform:uppercase;">Reach Your Real Estate Apex</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#cccccc;">Hi <strong style="color:#ffffff;">${firstName}</strong>,</p>

              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#cccccc;">Your administrator has requested a password reset for your Reapex Agent Portal account.</p>

              <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#cccccc;">Click the button below to set a new password. This link will expire in 24 hours.</p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${resetLink}" style="display:inline-block;background-color:#d4af37;color:#0a0a0a;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:6px;letter-spacing:0.5px;">Reset Your Password</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#999;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin:0 0 28px;font-size:13px;color:#d4af37;word-break:break-all;">${resetLink}</p>

              <hr style="border:none;border-top:1px solid #2a2a2a;margin:24px 0;">

              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#999;">If you did not expect this email, you can safely ignore it. Your password will remain unchanged.</p>

              <p style="margin:0 0 4px;font-size:14px;line-height:1.6;color:#999;">Need help? Contact us at <a href="mailto:admin@re-apex.com" style="color:#d4af37;text-decoration:none;">admin@re-apex.com</a></p>
            </td>
          </tr>

          <!-- Footer -->
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

// POST - Send password reset link to a user
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

    // Verify caller is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
    const admin = await verifyAdminAccess(supabase, user.id);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, email, fullName } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }

    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Generate a password reset link using the admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.re-apex.com'}/auth/callback?next=/reset-password`,
      },
    });

    if (linkError) {
      console.error('[Reset Password] Link generation error:', linkError);
      return NextResponse.json(
        { error: linkError.message || 'Failed to generate reset link' },
        { status: 400 }
      );
    }

    // The generated link contains a token — extract and build the proper reset URL
    const resetLink = linkData?.properties?.action_link;

    if (!resetLink) {
      return NextResponse.json(
        { error: 'Failed to generate reset link' },
        { status: 500 }
      );
    }

    // Send the reset email via Resend
    let emailSent = false;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const emailResult = await resend.emails.send({
          from: 'Reapex <admin@re-apex.com>',
          to: email,
          subject: 'Reset Your Password - Reapex Agent Portal',
          html: buildPasswordResetEmail(fullName || email, resetLink),
        });

        if (emailResult.error) {
          console.error('[Reset Password] Resend API error:', JSON.stringify(emailResult.error));
        } else {
          emailSent = true;
        }
      } catch (emailError: any) {
        console.error('[Reset Password] Email send exception:', emailError?.message || emailError);
      }
    }

    if (!emailSent) {
      // Fallback: return the link to the admin so they can share it manually
      return NextResponse.json({
        success: true,
        emailSent: false,
        resetLink,
        message: 'Reset link generated but email could not be sent. Share the link manually.',
      });
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
      message: `Password reset email sent to ${email}`,
    });
  } catch (error: any) {
    console.error('[Reset Password] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
