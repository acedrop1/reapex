import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

const PLAN_PRICE_IDS = {
    launch: 'price_1SZLDsLJ58SkLqL0LbEF7pAO', // FREE – $0/mo
    growth: 'price_1SZLEOLJ58SkLqL0inV4Ecpa',  // $225/mo
    pro: 'price_1SZLEgLJ58SkLqL0BtiTzn4J',     // $550/mo
};

const PLAN_COMMISSIONS = {
    launch: '80/20 Split',
    growth: '90/10 Split',
    pro: '100% Commission',
};

export async function POST(req: Request) {
    try {
        const stripe = getStripe();
        const supabase = await createClient();
        const { formData } = await req.json();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Update Profile in Supabase
        // Get user's full name to generate email
        const { data: userData } = await supabase
            .from('users')
            .select('full_name, stripe_customer_id')
            .eq('id', user.id)
            .single();

        const updateData: any = {
            bio: formData.bio,
            phone_visible: formData.phone_visible,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
            subscription_plan: formData.selected_plan,
            specialties: formData.specialties,
            years_experience: formData.years_experience,
            languages: formData.languages,
            cap_amount: formData.selected_plan === 'launch' ? 18000 :
                formData.selected_plan === 'growth' ? 12000 : 0,
        };

        // Add phone if provided
        if (formData.phone) {
            updateData.phone = formData.phone.replace(/\D/g, ''); // Store unformatted
        }

        // Add social media fields if they have values
        if (formData.instagram) updateData.social_instagram = formData.instagram;
        if (formData.facebook) updateData.social_facebook = formData.facebook;
        if (formData.linkedin) updateData.social_linkedin = formData.linkedin;
        if (formData.x) updateData.social_x = formData.x;
        if (formData.tiktok) updateData.social_tiktok = formData.tiktok;
        if (formData.website) updateData.website = formData.website;

        // 2. Stripe Integration
        let customerId = userData?.stripe_customer_id;

        // Create Customer if doesn't exist
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email, // Use their auth email for Stripe
                name: fullName,
                metadata: {
                    supabase_user_id: user.id,
                },
            });
            customerId = customer.id;
            updateData.stripe_customer_id = customerId;
        }

        // If card info is provided, create a Payment Method and attach to customer
        // NOTE: In a production environment, you should use Stripe Elements on the frontend
        // to tokenize the card insecurely and send a PaymentMethod ID, NOT raw card details.
        // For this implementation, as requested by the user, we will assume we are handling raw details 
        // but WE MUST TOKENIZE THEM immediately.
        // However, since we don't have frontend tokenization set up with Elements yet, 
        // we will create a Token or PaymentMethod serverside (Not PCI compliant for real production without specialized SAQ).
        // BETTER APPROACH: The frontend should send a PaymentMethodId. 
        // BUT since the user's prompt implies we are just collecting data in the form, 
        // I will mock the "Payment Logic" or use a test token if possible, OR
        // actually, `stripe.paymentMethods.create` server-side requires raw card data which implies high PCI compliance.

        // CRITICAL: The prompt asked to "Save Payment Information".
        // Since we are adding fields to a simple React form (not Stripe Elements),
        // and passing them to the API, we are processing raw card data.
        // I will implement this using `stripe.tokens.create` or `paymentMethods.create` for now,
        // but add a comment that this should be upgraded to Stripe Elements for security.

        if (formData.payment_method_id) {
            try {
                // Attach to customer if not already (it should be attached via setup intent, but good to ensure)
                await stripe.paymentMethods.attach(formData.payment_method_id, {
                    customer: customerId,
                });

                // Set as default
                await stripe.customers.update(customerId, {
                    invoice_settings: {
                        default_payment_method: formData.payment_method_id,
                    },
                });
            } catch (paymentError: any) {
                // Ignore "already attached" errors
                if (paymentError.code !== 'resource_already_exists') {
                    console.error('Stripe Payment Method Error:', paymentError);
                    throw new Error(`Payment error: ${paymentError.message}`);
                }
            }
        }

        // 3. Create Subscription
        // Only if a paid plan is selected (skip for free plan: launch)
        // First month is free (30-day trial), then billed monthly for 1-year term
        if (formData.selected_plan !== 'launch') {
            const priceId = PLAN_PRICE_IDS[formData.selected_plan as keyof typeof PLAN_PRICE_IDS];
            if (priceId) {
                try {
                    // Build subscription params with 30-day free trial
                    const subscriptionParams: any = {
                        customer: customerId,
                        items: [{ price: priceId }],
                        trial_period_days: 30, // First month free
                        metadata: {
                            supabase_user_id: user.id,
                            plan_locked_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1-year lock
                        },
                        expand: ['latest_invoice.payment_intent'],
                    };

                    // Apply promo code if provided
                    if (formData.promo_code) {
                        try {
                            const promotionCodes = await stripe.promotionCodes.list({
                                code: formData.promo_code,
                                active: true,
                                limit: 1,
                            });
                            if (promotionCodes.data.length > 0) {
                                subscriptionParams.promotion_code = promotionCodes.data[0].id;
                            }
                        } catch (promoErr) {
                            console.warn('Promo code lookup failed:', promoErr);
                            // Continue without promo - don't block subscription
                        }
                    }

                    const subscription = await stripe.subscriptions.create(subscriptionParams);
                    updateData.stripe_subscription_id = subscription.id;

                    // Store the plan lock date so we can enforce no upgrades/downgrades for 1 year
                    updateData.plan_locked_until = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
                } catch (subError: any) {
                    console.error('Stripe Subscription Error:', subError);
                    throw new Error(`Subscription error: ${subError.message}`);
                }
            }
        }

        // For Launch plan, also lock for 1 year
        if (formData.selected_plan === 'launch') {
            updateData.plan_locked_until = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        }

        // 4. Update Database
        const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', user.id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Onboarding Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
