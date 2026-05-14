import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/utils/auth';
import { Resend } from 'resend';

function buildAdminNotificationEmail(application: {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  license_number: string;
  transactions_12_months: number;
  sales_volume_range: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
          <tr>
            <td style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%);padding:40px 40px 30px;text-align:center;border-bottom:2px solid #d4af37;">
              <h1 style="margin:0;font-size:32px;font-weight:700;color:#d4af37;letter-spacing:1px;">REAPEX</h1>
              <p style="margin:8px 0 0;font-size:13px;color:#999;letter-spacing:3px;text-transform:uppercase;">New Application Received</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 20px;font-size:22px;color:#ffffff;font-weight:600;">New Agent Application</h2>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#cccccc;">A new agent has submitted an application to join Reapex.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#141414;border:1px solid rgba(212,175,55,0.2);border-radius:8px;margin:24px 0;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Name</p>
                    <p style="margin:0 0 16px;font-size:16px;color:#ffffff;font-weight:500;">${application.first_name} ${application.last_name}</p>
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Email</p>
                    <p style="margin:0 0 16px;font-size:16px;color:#ffffff;font-weight:500;">${application.email}</p>
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Phone</p>
                    <p style="margin:0 0 16px;font-size:16px;color:#ffffff;font-weight:500;">${application.phone_number}</p>
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">License Number</p>
                    <p style="margin:0 0 16px;font-size:16px;color:#ffffff;font-weight:500;">${application.license_number}</p>
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Transactions (Last 12 Months)</p>
                    <p style="margin:0 0 16px;font-size:16px;color:#ffffff;font-weight:500;">${application.transactions_12_months}</p>
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Sales Volume</p>
                    <p style="margin:0;font-size:16px;color:#ffffff;font-weight:500;">${application.sales_volume_range}</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="https://re-apex.com/admin/applications" style="display:inline-block;background-color:#d4af37;color:#0a0a0a;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:6px;letter-spacing:0.5px;">Review Application</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#080808;padding:24px 40px;text-align:center;border-top:1px solid #1a1a1a;">
              <p style="margin:0;font-size:12px;color:#666;">This is an automated notification from your Reapex portal.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      phoneNumber,
      email,
      licenseNumber,
      transactions12Months,
      salesVolumeRange,
      commissionPlans,
      photoIdUrl,
    } = body;

    // Validate required fields
    const missingFields = [];
    if (!firstName) missingFields.push('firstName');
    if (!lastName) missingFields.push('lastName');
    if (!phoneNumber) missingFields.push('phoneNumber');
    if (!email) missingFields.push('email');
    if (!licenseNumber) missingFields.push('licenseNumber');
    if (transactions12Months === undefined || transactions12Months === null || transactions12Months === '') {
      missingFields.push('transactions12Months');
    }
    if (!salesVolumeRange) missingFields.push('salesVolumeRange');

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      console.error('Received data:', { firstName, lastName, phoneNumber, email, licenseNumber, transactions12Months, salesVolumeRange, commissionPlans });
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields,
          details: `Please provide: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS for public submissions
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Insert application
    const { data, error } = await supabase
      .from('agent_applications')
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        email: email,
        license_number: licenseNumber,
        transactions_12_months: transactions12Months,
        sales_volume_range: salesVolumeRange,
        commission_plans: commissionPlans || [],
        photo_id_url: photoIdUrl || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      );
    }

    // Send notification email to all admins
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        // Get all admin emails
        const { data: admins } = await supabase
          .from('users')
          .select('email')
          .eq('role', 'admin');

        const adminEmails = admins?.map((a: any) => a.email).filter(Boolean) || [];

        if (adminEmails.length > 0) {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: 'Reapex <admin@re-apex.com>',
            to: adminEmails,
            subject: `New Agent Application: ${firstName} ${lastName}`,
            html: buildAdminNotificationEmail({
              first_name: firstName,
              last_name: lastName,
              email,
              phone_number: phoneNumber,
              license_number: licenseNumber,
              transactions_12_months: transactions12Months,
              sales_volume_range: salesVolumeRange,
            }),
          });
        }
      }
    } catch (emailError) {
      // Don't fail the application submission if email fails
      console.error('Failed to send admin notification email:', emailError);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !isAdmin(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all applications
    const { data, error } = await supabase
      .from('agent_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
