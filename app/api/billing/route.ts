import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-11-17.clover' as any, // Casting to any to avoid strict type checks if the version is weird
});

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: userData } = await supabase
            .from('users')
            .select('stripe_customer_id, subscription_plan, commission_plan')
            .eq('id', user.id)
            .single();

        if (!userData?.stripe_customer_id) {
            return NextResponse.json({
                plan: userData?.subscription_plan || 'launch',
                status: 'active', // Default for free plan
                paymentMethod: null,
            });
        }

        const customer = await stripe.customers.retrieve(userData.stripe_customer_id, {
            expand: ['invoice_settings.default_payment_method'],
        }) as Stripe.Customer;

        let paymentMethodDetails = null;
        const defaultPaymentMethod = customer.invoice_settings.default_payment_method as Stripe.PaymentMethod;

        if (defaultPaymentMethod && defaultPaymentMethod.card) {
            paymentMethodDetails = {
                brand: defaultPaymentMethod.card.brand,
                last4: defaultPaymentMethod.card.last4,
                exp_month: defaultPaymentMethod.card.exp_month,
                exp_year: defaultPaymentMethod.card.exp_year,
            };
        }

        // Get active subscription
        const subscriptions = await stripe.subscriptions.list({
            customer: userData.stripe_customer_id,
            status: 'active',
            limit: 1,
        });

        const currentSubscription = subscriptions.data[0] as any;

        return NextResponse.json({
            plan: userData.subscription_plan,
            status: currentSubscription?.status || 'active',
            currentPeriodEnd: currentSubscription?.current_period_end
                ? new Date(currentSubscription.current_period_end * 1000).toISOString()
                : null,
            paymentMethod: paymentMethodDetails,
        });

    } catch (error: any) {
        console.error('Billing API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
