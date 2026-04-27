import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

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
    // Verify webhook signature
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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const productId = session.metadata?.product_id;

        if (userId && productId) {
          const planName = PRODUCT_PLAN_MAP[productId];

          if (planName) {
            // Update user's commission plan
            const { error } = await supabase
              .from('users')
              .update({
                commission_plan: planName,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
                subscription_status: 'active',
              })
              .eq('id', userId);

            if (error) {
              console.error('Failed to update user plan:', error);
            } else {
              console.log(`Updated user ${userId} to ${planName}`);
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          const status = subscription.status;

          // Update subscription status
          const { error } = await supabase
            .from('users')
            .update({
              subscription_status: status,
            })
            .eq('stripe_subscription_id', subscription.id);

          if (error) {
            console.error('Failed to update subscription status:', error);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Update user to cancelled status
        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: 'cancelled',
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Failed to cancel subscription:', error);
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
