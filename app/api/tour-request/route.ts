import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const {
      agentId,
      agentName,
      agentEmail,
      visitorName,
      visitorEmail,
      visitorPhone,
      listingAddress,
      requestedDate,
      requestedTime,
    } = await req.json();

    // If agentEmail not passed, look it up
    let toEmail = agentEmail;
    if (!toEmail && agentId) {
      const { data: agent } = await supabase
        .from('users')
        .select('email')
        .eq('id', agentId)
        .single();
      toEmail = agent?.email;
    }

    if (!toEmail) {
      return NextResponse.json({ error: 'Agent email not found' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: 'Reapex <admin@re-apex.com>',
      to: toEmail,
      subject: `New Tour Request: ${listingAddress}`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
          <tr>
            <td style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%);padding:40px 40px 30px;text-align:center;border-bottom:2px solid #d4af37;">
              <h1 style="margin:0;font-size:32px;font-weight:700;color:#d4af37;letter-spacing:1px;">REAPEX</h1>
              <p style="margin:8px 0 0;font-size:13px;color:#999;letter-spacing:3px;text-transform:uppercase;">New Tour Request</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;font-size:22px;color:#ffffff;font-weight:600;">
                Hi ${agentName || 'Agent'},
              </h2>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#cccccc;">
                You have a new tour request for one of your listings. Please reach out to confirm the details.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#141414;border:1px solid rgba(212,175,55,0.2);border-radius:8px;margin:24px 0;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Property</p>
                    <p style="margin:0 0 16px;font-size:16px;color:#d4af37;font-weight:600;">${listingAddress}</p>

                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Requested Date & Time</p>
                    <p style="margin:0 0 16px;font-size:16px;color:#ffffff;font-weight:500;">${requestedDate} at ${requestedTime}</p>

                    <hr style="border:none;border-top:1px solid #2a2a2a;margin:16px 0;">

                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Visitor Name</p>
                    <p style="margin:0 0 16px;font-size:16px;color:#ffffff;font-weight:500;">${visitorName}</p>

                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Email</p>
                    <p style="margin:0 0 16px;font-size:16px;color:#ffffff;font-weight:500;">
                      <a href="mailto:${visitorEmail}" style="color:#d4af37;text-decoration:none;">${visitorEmail}</a>
                    </p>

                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Phone</p>
                    <p style="margin:0;font-size:16px;color:#ffffff;font-weight:500;">
                      <a href="tel:${visitorPhone}" style="color:#d4af37;text-decoration:none;">${visitorPhone}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="https://re-apex.com/dashboard" style="display:inline-block;background-color:#d4af37;color:#0a0a0a;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:6px;letter-spacing:0.5px;">View in Portal</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;line-height:1.6;color:#666;">
                Please contact the visitor to confirm the tour time and details. This is a request only &mdash; no appointment has been confirmed yet.
              </p>
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
</html>`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Tour request email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
