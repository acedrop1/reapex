import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Product ID to plan name mapping
const PRODUCT_PLAN_MAP: Record<string, string> = {
  'prod_TWO0k1liPxisfq': 'Reapex Pro',
  'prod_TWO0eJAXu13836': 'Reapex Growth',
  'prod_TWNzj9R1fsELnE': 'Reapex Launch',
};

// ─── Email Templates ───────────────────────────────────────────────

function buildBillingEmailForAdmin({
  subject,
  headline,
  bodyText,
  agentName,
  agentEmail,
  amount,
  planName,
  statusColor,
  ctaText,
  ctaUrl,
}: {
  subject: string;
  headline: string;
  bodyText: string;
  agentName: string;
  agentEmail: string;
  amount?: string;
  planName?: string;
  statusColor: string;
  ctaText?: string;
  ctaUrl?: string;
}): string {
  const ctaBlock = ctaText && ctaUrl ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding:8px 0 24px;">
          <a href="${ctaUrl}" style="display:inline-block;background-color:#d4af37;color:#0a0a0a;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:6px;letter-spacing:0.5px;">${ctaText}</a>
        </td>
      </tr>
    </table>` : '';

  return `<!DOCTYPE html>
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
              <p style="margin:8px 0 0;font-size:13px;color:#999;letter-spacing:3px;text-transform:uppercase;">Billing Notification</p>
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
                    <p style="margin:0 0 ${amount ? '16px' : '0'};font-size:16px;color:#ffffff;font-weight:500;">${agentEmail}</p>
                    ${amount ? `
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Amount</p>
                    <p style="margin:0 0 ${planName ? '16px' : '0'};font-size:24px;color:#d4af37;font-weight:700;">${amount}</p>
                    ` : ''}
                    ${planName ? `
                    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Plan</p>
                    <p style="margin:0;font-size:16px;color:#ffffff;font-weight:500;">${planName}</p>
                    ` : ''}
                  </td>
                </tr>
              </table>
              ${ctaBlock}
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
</html>`;
}

// ─── Helper: send email to all admins ──────────────────────────────

async function sendAdminBillingEmail(emailSubject: string, htmlBody: string) {
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
    await resend.emails.send({
      from: 'Reapex <admin@re-apex.com>',
      to: adminEmails,
      subject: emailSubject,
      html: htmlBody,
    });
  } catch (emailError) {
    console.error('Failed to send admin billing email:', emailError);
  }
}

// ─── Helper: look up agent by Stripe customer ID ──────────────────

async function getAgentByCustomerId(customerId: string) {
  const { data } = await supabase
    .from('users')
    .select('id, full_name, email, subscription_plan, commission_plan')
    .eq('stripe_customer_id', customerId)
    .single();
  return data;
}

// ─── Webhook Handler ───────────────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      // ── Checkout completed (original flow) ──
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const productId = session.metadata?.product_id;

        if (userId && productId) {
          const planName = PRODUCT_PLAN_MAP[productId];
          if (planName) {
            const { error } = await supabase
              .from('users')
              .update({
                commission_plan: planName,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
                subscription_status: 'active',
              })
              .eq('id', userId);

            if (error) console.error('Failed to update user plan:', error);
          }
        }
        break;
      }

      // ── Invoice paid successfully ──
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const agent = await getAgentByCustomerId(customerId);

        if (agent) {
          // Update subscription status to active
          await supabase
            .from('users')
            .update({ subscription_status: 'active' })
            .eq('id', agent.id);

          const amount = (invoice.amount_paid / 100).toFixed(2);

          // Don't email for $0 invoices (trial starts, etc.)
          if (invoice.amount_paid > 0) {
            await sendAdminBillingEmail(
              `Payment Received: $${amount} from ${agent.full_name}`,
              buildBillingEmailForAdmin({
                subject: 'Payment Received',
                headline: 'Payment Successful',
                bodyText: `A subscription payment of $${amount} was successfully collected.`,
                agentName: agent.full_name || 'Unknown Agent',
                agentEmail: agent.email || '',
                amount: `$${amount}`,
                planName: agent.commission_plan || agent.subscription_plan || '',
                statusColor: '#22c55e',
                ctaText: 'View in Stripe',
                ctaUrl: `https://dashboard.stripe.com/invoices/${invoice.id}`,
              })
            );
          }
        }
        break;
      }

      // ── Invoice payment failed ──
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const agent = await getAgentByCustomerId(customerId);

        if (agent) {
          // Update subscription status to past_due
          await supabase
            .from('users')
            .update({ subscription_status: 'past_due' })
            .eq('id', agent.id);

          const amount = (invoice.amount_due / 100).toFixed(2);
          const attemptCount = invoice.attempt_count || 1;

          await sendAdminBillingEmail(
            `Payment Failed: $${amount} from ${agent.full_name} (Attempt ${attemptCount})`,
            buildBillingEmailForAdmin({
              subject: 'Payment Failed',
              headline: 'Payment Failed',
              bodyText: `A subscription payment of $${amount} failed to process. This was attempt #${attemptCount}. Stripe will automatically retry. You may want to reach out to the agent to update their payment method.`,
              agentName: agent.full_name || 'Unknown Agent',
              agentEmail: agent.email || '',
              amount: `$${amount}`,
              planName: agent.commission_plan || agent.subscription_plan || '',
              statusColor: '#ef4444',
              ctaText: 'View in Stripe',
              ctaUrl: `https://dashboard.stripe.com/invoices/${invoice.id}`,
            })
          );
        }
        break;
      }

      // ── Upcoming invoice (sent ~3 days before charge) ──
      case 'invoice.upcoming': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const agent = await getAgentByCustomerId(customerId);

        if (agent) {
          const amount = ((invoice.amount_due || 0) / 100).toFixed(2);

          // Only notify for non-zero upcoming invoices
          if (invoice.amount_due && invoice.amount_due > 0) {
            await sendAdminBillingEmail(
              `Upcoming Charge: $${amount} for ${agent.full_name}`,
              buildBillingEmailForAdmin({
                subject: 'Upcoming Charge',
                headline: 'Upcoming Invoice',
                bodyText: `An invoice of $${amount} will be charged in the next few days for this agent's subscription.`,
                agentName: agent.full_name || 'Unknown Agent',
                agentEmail: agent.email || '',
                amount: `$${amount}`,
                planName: agent.commission_plan || agent.subscription_plan || '',
                statusColor: '#f59e0b',
              })
            );
          }
        }
        break;
      }

      // ── Subscription updated ──
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        const { error } = await supabase
          .from('users')
          .update({ subscription_status: subscription.status })
          .eq('stripe_subscription_id', subscription.id);

        if (error) console.error('Failed to update subscription status:', error);
        break;
      }

      // ── Subscription cancelled/deleted ──
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const agent = await getAgentByCustomerId(customerId);

        const { error } = await supabase
          .from('users')
          .update({ subscription_status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id);

        if (error) console.error('Failed to cancel subscription:', error);

        if (agent) {
          await sendAdminBillingEmail(
            `Subscription Cancelled: ${agent.full_name}`,
            buildBillingEmailForAdmin({
              subject: 'Subscription Cancelled',
              headline: 'Subscription Cancelled',
              bodyText: `This agent's subscription has been cancelled. They will retain access until the end of their current billing period.`,
              agentName: agent.full_name || 'Unknown Agent',
              agentEmail: agent.email || '',
              planName: agent.commission_plan || agent.subscription_plan || '',
              statusColor: '#ef4444',
              ctaText: 'View Agent Billing',
              ctaUrl: 'https://re-apex.com/admin/agent-billing',
            })
          );
        }
        break;
      }

      // ── Charge succeeded (covers one-off admin charges too) ──
      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge;
        const customerId = charge.customer as string;

        // Only send email for charges NOT tied to an invoice (invoices already handled above)
        if (customerId && !charge.invoice) {
          const agent = await getAgentByCustomerId(customerId);
          if (agent) {
            const amount = (charge.amount / 100).toFixed(2);
            await sendAdminBillingEmail(
              `One-Time Charge Collected: $${amount} from ${agent.full_name}`,
              buildBillingEmailForAdmin({
                subject: 'Charge Collected',
                headline: 'Charge Successful',
                bodyText: `A one-time charge of $${amount} was successfully collected. ${charge.description ? `Description: ${charge.description}` : ''}`,
                agentName: agent.full_name || 'Unknown Agent',
                agentEmail: agent.email || '',
                amount: `$${amount}`,
                statusColor: '#22c55e',
                ctaText: 'View in Stripe',
                ctaUrl: `https://dashboard.stripe.com/payments/${charge.id}`,
              })
            );
          }
        }
        break;
      }

      // ── Charge failed (covers one-off admin charges too) ──
      case 'charge.failed': {
        const charge = event.data.object as Stripe.Charge;
        const customerId = charge.customer as string;

        if (customerId && !charge.invoice) {
          const agent = await getAgentByCustomerId(customerId);
          if (agent) {
            const amount = (charge.amount / 100).toFixed(2);
            await sendAdminBillingEmail(
              `Charge Failed: $${amount} for ${agent.full_name}`,
              buildBillingEmailForAdmin({
                subject: 'Charge Failed',
                headline: 'Charge Failed',
                bodyText: `A one-time charge of $${amount} failed to process. ${charge.failure_message ? `Reason: ${charge.failure_message}` : 'The card may need to be updated.'}`,
                agentName: agent.full_name || 'Unknown Agent',
                agentEmail: agent.email || '',
                amount: `$${amount}`,
                statusColor: '#ef4444',
                ctaText: 'View Agent Billing',
                ctaUrl: 'https://re-apex.com/admin/agent-billing',
              })
            );
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
