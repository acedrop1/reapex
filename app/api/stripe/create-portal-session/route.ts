import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
});

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's stripe_customer_id
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();

        if (userError || !userData?.stripe_customer_id) {
            return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
        }

        // Create session
        const session = await stripe.billingPortal.sessions.create({
            customer: userData.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/profile`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Portal session error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create portal session' },
            { status: 500 }
        );
    }
}
