import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const supabase = await createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { agent_id, amount, description } = await req.json();

    if (!agent_id || !amount || !description) {
      return NextResponse.json({ error: 'Missing required fields: agent_id, amount, description' }, { status: 400 });
    }

    if (amount < 50) {
      return NextResponse.json({ error: 'Minimum charge is $0.50' }, { status: 400 });
    }

    // Get agent's Stripe customer ID and info
    const { data: agent } = await supabase
      .from('users')
      .select('id, stripe_customer_id, full_name, email')
      .eq('id', agent_id)
      .single();

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (!agent.stripe_customer_id) {
      return NextResponse.json({ error: 'Agent has no payment method on file. They need to add a card in their Billing settings first.' }, { status: 400 });
    }

    // Get default payment method
    const paymentMethods = await stripe.paymentMethods.list({
      customer: agent.stripe_customer_id,
      type: 'card',
    });

    if (!paymentMethods.data.length) {
      return NextResponse.json({ error: 'Agent has no card on file. They need to add a card in their Billing settings first.' }, { status: 400 });
    }

    const defaultPaymentMethod = paymentMethods.data[0].id;
    const cardInfo = paymentMethods.data[0].card;

    // Create the charge record first (pending)
    const { data: chargeRecord, error: insertError } = await supabase
      .from('agent_charges')
      .insert({
        agent_id,
        admin_id: user.id,
        amount, // in cents
        description,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Create and confirm PaymentIntent
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount, // in cents
        currency: 'usd',
        customer: agent.stripe_customer_id,
        payment_method: defaultPaymentMethod,
        off_session: true,
        confirm: true,
        description: `Reapex Charge: ${description}`,
        receipt_email: agent.email, // Stripe sends an automatic receipt
        metadata: {
          agent_id,
          admin_id: user.id,
          charge_record_id: chargeRecord.id,
          charged_by: adminUser.full_name || 'Admin',
        },
      });

      // Update charge record with success
      await supabase
        .from('agent_charges')
        .update({
          stripe_payment_intent_id: paymentIntent.id,
          status: 'succeeded',
          receipt_sent: true, // Stripe sends receipt via receipt_email
          updated_at: new Date().toISOString(),
        })
        .eq('id', chargeRecord.id);

      // Create in-app notification for the agent
      await supabase.from('notifications').insert({
        user_id: agent_id,
        title: 'New Charge',
        message: `You have been charged $${(amount / 100).toFixed(2)} for: ${description}. A receipt has been sent to your email.`,
        type: 'billing',
        is_read: false,
      });

      return NextResponse.json({
        success: true,
        charge_id: chargeRecord.id,
        payment_intent_id: paymentIntent.id,
        amount,
        agent_name: agent.full_name,
        agent_email: agent.email,
        card_last4: cardInfo?.last4,
        card_brand: cardInfo?.brand,
      });
    } catch (stripeError: any) {
      // Payment failed — update record
      await supabase
        .from('agent_charges')
        .update({
          status: 'failed',
          failure_reason: stripeError.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chargeRecord.id);

      return NextResponse.json({
        error: `Payment failed: ${stripeError.message}`,
        charge_id: chargeRecord.id,
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Admin charge error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET — fetch charge history
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: charges, error } = await supabase
      .from('agent_charges')
      .select(`
        *,
        agent:users!agent_charges_agent_id_fkey(full_name, email),
        admin:users!agent_charges_admin_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ charges });
  } catch (error: any) {
    console.error('Fetch charges error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
