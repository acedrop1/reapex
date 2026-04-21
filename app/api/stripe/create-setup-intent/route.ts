import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
});

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get or create customer
        const { data: userData } = await supabase
            .from('users')
            .select('stripe_customer_id, full_name, email')
            .eq('id', user.id)
            .single();

        let customerId = userData?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: userData?.full_name || 'Agent',
                metadata: { supabase_user_id: user.id },
            });
            customerId = customer.id;
            // Save customer ID
            await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id);
        }

        const setupIntent = await stripe.setupIntents.create({
            customer: customerId,
            payment_method_types: ['card'],
        });

        return NextResponse.json({ clientSecret: setupIntent.client_secret });
    } catch (error: any) {
        console.error('Error creating setup intent:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
