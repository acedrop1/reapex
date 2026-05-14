import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export async function GET(req: Request) {
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(req.url);
    const agentId = url.searchParams.get('agent_id');
    if (!agentId) {
      return NextResponse.json({ error: 'Missing agent_id' }, { status: 400 });
    }

    const { data: agent } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', agentId)
      .single();

    if (!agent?.stripe_customer_id) {
      return NextResponse.json({ card: null });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: agent.stripe_customer_id,
      type: 'card',
    });

    if (!paymentMethods.data.length) {
      return NextResponse.json({ card: null });
    }

    const card = paymentMethods.data[0].card;
    return NextResponse.json({
      card: {
        brand: card?.brand,
        last4: card?.last4,
        exp_month: card?.exp_month,
        exp_year: card?.exp_year,
      },
    });
  } catch (error: any) {
    console.error('Fetch card error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
