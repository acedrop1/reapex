import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';
import { Resend } from 'resend';

/**
 * GET /api/cron/process-charges
 *
 * Runs daily via Vercel Cron. Processes all scheduled and recurring charges
 * whose next_charge_date is today or in the past.
 *
 * - One-time scheduled charges: charge once, mark as 'completed'
 * - Recurring charges: charge, advance next_charge_date, increment counter
 *
 * Security: Requires CRON_SECRET Bearer token
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getNextChargeDate(currentDate: string, interval: string): string {
  const date = new Date(currentDate + 'T00:00:00Z');
  switch (interval) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString().split('T')[0];
}

async function sendChargeResultEmail(
  agentName: string,
  agentEmail: string,
  amount: string,
  description: string,
  success: boolean,
  errorMessage?: string
) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) return;

    const { data: admins } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'admin');

    const adminEmails = admins?.map((a: any) => a.email).filter(Boolean) || [];
    if (adminEmails.length === 0) return;

    const resend = new Resend(resendApiKey);
    const subject = success
      ? `Scheduled Charge Collected: $${amount} from ${agentName}`
      : `Scheduled Charge Failed: $${amount} for ${agentName}`;

    const statusColor = success ? '#22c55e' : '#ef4444';
    const headline = success ? 'Charge Successful' : 'Charge Failed';
    const bodyText = success
      ? `A scheduled charge of $${amount} was successfully collected. Description: ${description}`
      : `A scheduled charge of $${amount} failed to process. ${errorMessage ? `Reason: ${errorMessage}` : 'The card may need to be updated.'} Description: ${description}`;

    await resend.emails.send({
      from: 'Reapex <admin@re-apex.com>',
      to: adminEmails,
      subject,
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
              <p style="margin:8px 0 0;font-size:13px;color:#999;letter-spacing:3px;text-transform:uppercase;">Scheduled Charge</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <div style="display:inline-block;background-color:${statusColor};color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:4px;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px;">${headline}</div>
              <p style="margin:16px 0 24px;font-size:16px;line-height:1.6;color:#cccccc;">${bodyText}</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#141414;border:1px solid rgba(212,175,55,0.2);border-radius:8px;margin:24px 0;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Agent</p>
                    <p style="margin:0 0 16px;font-size:16px;color:#ffffff;font-weight:500;">${agentName}</p>
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Email</p>
                    <p style="margin:0 0 16px;font-size:16px;color:#ffffff;font-weight:500;">${agentEmail}</p>
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Amount</p>
                    <p style="margin:0;font-size:24px;color:#d4af37;font-weight:700;">$${amount}</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="https://re-apex.com/admin/agent-billing" style="display:inline-block;background-color:#d4af37;color:#0a0a0a;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:6px;letter-spacing:0.5px;">View Agent Billing</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#080808;padding:24px 40px;text-align:center;border-top:1px solid #1a1a1a;">
              <p style="margin:0;font-size:12px;color:#666;">This is an automated billing notification from your Reapex portal.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
  } catch (emailError) {
    console.error('Failed to send scheduled charge email:', emailError);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      );
    }

    const stripe = getStripe();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Fetch all active charges due today or overdue
    const { data: dueCharges, error: fetchError } = await supabase
      .from('scheduled_charges')
      .select(`
        *,
        agent:users!scheduled_charges_agent_id_fkey(id, full_name, email, stripe_customer_id)
      `)
      .eq('status', 'active')
      .lte('next_charge_date', today);

    if (fetchError) {
      console.error('Failed to fetch due charges:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch charges' }, { status: 500 });
    }

    if (!dueCharges || dueCharges.length === 0) {
      return NextResponse.json({
        message: 'No charges due today',
        processed: 0,
        date: today,
      });
    }

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const charge of dueCharges) {
      const agent = charge.agent as any;
      const amountStr = (charge.amount / 100).toFixed(2);

      if (!agent?.stripe_customer_id) {
        console.error(`Agent ${charge.agent_id} has no Stripe customer ID, skipping charge ${charge.id}`);
        results.push({ id: charge.id, success: false, error: 'No card on file' });

        await sendChargeResultEmail(
          agent?.full_name || 'Unknown',
          agent?.email || '',
          amountStr,
          charge.description,
          false,
          'Agent has no card on file'
        );
        continue;
      }

      try {
        // Get the customer's default payment method
        const customer = await stripe.customers.retrieve(agent.stripe_customer_id) as Stripe.Customer;
        const defaultPm = customer.invoice_settings?.default_payment_method as string | null;

        if (!defaultPm) {
          throw new Error('No default payment method on file');
        }

        // Create a PaymentIntent and confirm immediately
        await stripe.paymentIntents.create({
          amount: charge.amount,
          currency: 'usd',
          customer: agent.stripe_customer_id,
          payment_method: defaultPm,
          off_session: true,
          confirm: true,
          description: charge.description,
          metadata: {
            scheduled_charge_id: charge.id,
            agent_id: charge.agent_id,
            charge_type: charge.charge_type,
          },
        });

        // Update the charge record
        if (charge.charge_type === 'scheduled') {
          // One-time: mark as completed
          await supabase
            .from('scheduled_charges')
            .update({
              status: 'completed',
              last_charged_at: new Date().toISOString(),
              total_charges_made: (charge.total_charges_made || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', charge.id);
        } else {
          // Recurring: advance the next_charge_date
          const nextDate = getNextChargeDate(
            charge.next_charge_date,
            charge.recurrence_interval || 'monthly'
          );

          await supabase
            .from('scheduled_charges')
            .update({
              next_charge_date: nextDate,
              last_charged_at: new Date().toISOString(),
              total_charges_made: (charge.total_charges_made || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', charge.id);
        }

        // Also log to the agent_charges table so it shows in charge history
        await supabase.from('agent_charges').insert({
          agent_id: charge.agent_id,
          admin_id: charge.admin_id,
          amount: charge.amount,
          description: charge.description,
          status: 'succeeded',
        });

        results.push({ id: charge.id, success: true });

        await sendChargeResultEmail(
          agent.full_name || 'Unknown',
          agent.email || '',
          amountStr,
          charge.description,
          true
        );
      } catch (chargeError: any) {
        console.error(`Failed to process charge ${charge.id}:`, chargeError);
        results.push({ id: charge.id, success: false, error: chargeError.message });

        // Log the failed charge too
        await supabase.from('agent_charges').insert({
          agent_id: charge.agent_id,
          admin_id: charge.admin_id,
          amount: charge.amount,
          description: charge.description,
          status: 'failed',
        });

        await sendChargeResultEmail(
          agent.full_name || 'Unknown',
          agent.email || '',
          amountStr,
          charge.description,
          false,
          chargeError.message
        );
      }
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Processed ${results.length} charges: ${succeeded} succeeded, ${failed} failed`);

    return NextResponse.json({
      processed: results.length,
      succeeded,
      failed,
      date: today,
      results,
    });
  } catch (error: any) {
    console.error('Cron process-charges error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
