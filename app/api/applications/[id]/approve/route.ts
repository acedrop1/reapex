import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/utils/auth';
import { Resend } from 'resend';

function generatePassword(length = 12): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%&*';
  const all = uppercase + lowercase + numbers + special;

  // Ensure at least one of each type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

function generateSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

function buildWelcomeEmail(fullName: string, email: string, password: string): string {
  const firstName = fullName.split(' ')[0];
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

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%);padding:40px 40px 30px;text-align:center;border-bottom:2px solid #d4af37;">
              <h1 style="margin:0;font-size:32px;font-weight:700;color:#d4af37;letter-spacing:1px;">REAPEX</h1>
              <p style="margin:8px 0 0;font-size:13px;color:#999;letter-spacing:3px;text-transform:uppercase;">Real Estate Elevated</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#cccccc;">Welcome to the team, <strong style="color:#ffffff;">${firstName}</strong>!</p>

              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#cccccc;">We are thrilled to officially partner with you. At Reapex, our mission is to provide you with advanced tools, unmatched support, and a culture that elevates your business. You've made a great decision for your career, and now it's time to get to work.</p>

              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#cccccc;">Your Reapex Agent Portal is your central command center. From here, you will access your CRM, marketing assets, transaction management tools, and our exclusive training library.</p>

              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#cccccc;">Your account has been successfully provisioned. Here are your credentials to get started:</p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#141414;border:1px solid rgba(212,175,55,0.2);border-radius:8px;margin:0 0 24px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Portal Login URL</p>
                    <p style="margin:0 0 20px;font-size:16px;"><a href="https://www.re-apex.com/login" style="color:#d4af37;text-decoration:none;font-weight:500;">www.re-apex.com/login</a></p>
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Your Email</p>
                    <p style="margin:0 0 20px;font-size:16px;color:#ffffff;font-weight:500;">${email}</p>
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Temporary Password</p>
                    <p style="margin:0;font-size:18px;color:#d4af37;font-weight:600;font-family:monospace;letter-spacing:1px;">${password}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:#999;font-style:italic;">For your security, you will be prompted to create a new, permanent password upon your first login.</p>

              <!-- Next Steps -->
              <h3 style="margin:0 0 16px;font-size:18px;color:#ffffff;font-weight:700;">Your Next Steps to Launch:</h3>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#cccccc;">To ensure a frictionless onboarding experience, please complete the following within the next 24 hours:</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:8px 0;">
                    <p style="margin:0;font-size:15px;line-height:1.6;color:#cccccc;"><strong style="color:#d4af37;">1.</strong> <strong style="color:#ffffff;">Log In &amp; Secure Your Account:</strong> Use the credentials above to log in and set your new password.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <p style="margin:0;font-size:15px;line-height:1.6;color:#cccccc;"><strong style="color:#d4af37;">2.</strong> <strong style="color:#ffffff;">Complete Your Agent Profile:</strong> Upload your professional headshot, update your bio, and link your social media accounts so we can build your digital footprint on our main site.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="https://www.re-apex.com/login" style="display:inline-block;background-color:#d4af37;color:#0a0a0a;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:6px;letter-spacing:0.5px;">Sign In to Your Portal</a>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #2a2a2a;margin:24px 0;">

              <!-- Support -->
              <p style="margin:0 0 8px;font-size:14px;color:#ffffff;font-weight:700;">Need Help? We've got your back.</p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#999;">If you hit any technical snags, our support team is standing by. Just reply to this email or reach out directly to <a href="mailto:admin@re-apex.com" style="color:#d4af37;text-decoration:none;">admin@re-apex.com</a>.</p>

              <p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#cccccc;">Let's build something extraordinary together.</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#cccccc;">To your success,</p>

              <p style="margin:0 0 2px;font-size:15px;color:#ffffff;font-weight:600;">Ramzi Jaloudi, Founder</p>
              <p style="margin:0;font-size:14px;color:#d4af37;font-weight:500;">Reapex</p>
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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verify the caller is an admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !isAdmin(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch the application
    const serviceClient = await createServiceRoleClient();
    const { data: application, error: appError } = await serviceClient
      .from('agent_applications')
      .select('*')
      .eq('id', params.id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.status === 'approved') {
      return NextResponse.json(
        { error: 'Application has already been approved' },
        { status: 400 }
      );
    }

    // 3. Check if a user with this email already exists
    const { data: existingUsers } = await serviceClient
      .from('users')
      .select('id')
      .eq('email', application.email)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // 4. Generate password and create the auth user
    const password = generatePassword(14);
    const fullName = `${application.first_name} ${application.last_name}`.trim();
    const slug = generateSlug(fullName);

    const { data: newAuthUser, error: createError } =
      await serviceClient.auth.admin.createUser({
        email: application.email,
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: fullName,
        },
      });

    if (createError || !newAuthUser?.user) {
      console.error('Error creating auth user:', createError);
      return NextResponse.json(
        { error: createError?.message || 'Failed to create user account' },
        { status: 500 }
      );
    }

    // 5. Populate the user profile in the users table
    const { error: profileError } = await serviceClient
      .from('users')
      .upsert({
        id: newAuthUser.user.id,
        email: application.email,
        full_name: fullName,
        phone: application.phone_number,
        license_number: application.license_number,
        role: 'agent',
        account_status: 'approved',
        slug: slug,
        display_order: 0,
        hide_from_listing: false,
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Try to clean up the auth user since the profile failed
      await serviceClient.auth.admin.deleteUser(newAuthUser.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // 6. Update the application status
    await serviceClient
      .from('agent_applications')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    // 7. Send welcome email via Resend
    let emailSent = false;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: 'Reapex <admin@re-apex.com>',
          to: application.email,
          subject: 'Welcome to Reapex — Your Portal Access is Live!',
          html: buildWelcomeEmail(fullName, application.email, password),
        });
        emailSent = true;
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the whole operation if email fails
      }
    } else {
      console.warn('RESEND_API_KEY not set - welcome email not sent');
    }

    return NextResponse.json(
      {
        data: {
          userId: newAuthUser.user.id,
          email: application.email,
          fullName,
          slug,
          emailSent,
          tempPassword: emailSent ? undefined : password, // Only return password if email failed
        },
        message: emailSent
          ? 'Agent approved and welcome email sent'
          : 'Agent approved but email could not be sent. Temporary password is included in the response.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/applications/[id]/approve:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
