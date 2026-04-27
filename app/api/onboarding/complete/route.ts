import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

const PLAN_PRICE_IDS = {
    launch: 'price_launch', // FREE
    growth: 'price_growth', // $175/mo
    pro: 'price_pro',      // $450/mo
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

        // Generate @reapex.com email from full name
        const fullName = userData?.full_name || 'agent';
        const emailSlug = fullName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '.')
            .replace(/^\.+|\.+$/g, '');
        const generatedEmail = `${emailSlug}@reapex.com`;

        const updateData: any = {
            bio: formData.bio,
            email: generatedEmail,
            phone_visible: formData.phone_visible,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
            subscription_plan: formData.selected_plan,
            specialties: formData.specialties,
            years_experience: formData.years_experience,
            languages: formData.languages,
            cap_amount: formData.selected_plan === 'launch' ? 21000 :
                formData.selected_plan === 'growth' ? 18000 : 0,
        };

        // Add phone if provided
        if (formData.phone) {
            updateData.phone = formData.phone.replace(/\D/g, ''); // Store unformatted
        }

        // Add social media fields if they have values
        if (formData.instagram) updateData.social_instagram = formData.instagram;
        if (formData.facebook) updateData.social_facebook = formData.facebook;
        if (formData.linkedin) updateData.social_linkedin = formData.linkedin;
        if (formData.twitter) updateData.social_x = formData.twitter;
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
        // Only if a paid plan is selected
        if (formData.selected_plan !== 'launch') {
            const priceId = PLAN_PRICE_IDS[formData.selected_plan as keyof typeof PLAN_PRICE_IDS];
            if (priceId) {
                try {
                    const subscription = await stripe.subscriptions.create({
                        customer: customerId,
                        items: [{ price: priceId }],
                        metadata: {
                            supabase_user_id: user.id,
                        },
                        expand: ['latest_invoice.payment_intent'],
                    });
                    updateData.stripe_subscription_id = subscription.id;
                } catch (subError: any) {
                    console.error('Stripe Subscription Error:', subError);
                    throw new Error(`Subscription error: ${subError.message}`);
                }
            }
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
