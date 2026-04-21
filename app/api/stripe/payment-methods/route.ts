import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { safeParseUrl } from '@/lib/utils/errorHandler';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover',
});

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: userData } = await supabase
            .from('users')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();

        if (!userData?.stripe_customer_id) {
            return NextResponse.json({ paymentMethods: [] });
        }

        const paymentMethods = await stripe.paymentMethods.list({
            customer: userData.stripe_customer_id,
            type: 'card',
        });

        return NextResponse.json({ paymentMethods: paymentMethods.data });
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const url = safeParseUrl(req.url);
        if (!url) {
            return NextResponse.json({ error: 'Invalid request URL' }, { status: 400 });
        }

        const paymentMethodId = url.searchParams.get('id');
        if (!paymentMethodId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        await stripe.paymentMethods.detach(paymentMethodId);

        return NextResponse.json({ success: true });
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
