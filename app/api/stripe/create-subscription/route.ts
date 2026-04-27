import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const { priceId, productId, paymentMethodId, planId, planName } = await request.json();

    if (!priceId || !productId || !paymentMethodId || !planId || !planName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single();

    if (!userProfile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No customer ID found' },
        { status: 400 }
      );
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: userProfile.stripe_customer_id,
    });

    // Set as default payment method
    await stripe.customers.update(userProfile.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: userProfile.stripe_customer_id,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      metadata: {
        supabase_user_id: user.id,
        product_id: productId,
        plan_id: planId,
        plan_name: planName,
      },
      expand: ['latest_invoice.payment_intent'],
    });

    // Update user's subscription plan in database
    await supabase
      .from('users')
      .update({
        subscription_plan: planId,
        commission_plan: planName,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
