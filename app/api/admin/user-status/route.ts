import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use service role client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get all auth users to check last_sign_in_at
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const authUsers = authData?.users || [];

    // Build a map of user id -> last_sign_in_at
    const loginMap: Record<string, string | null> = {};
    authUsers.forEach((u) => {
      loginMap[u.id] = u.last_sign_in_at || null;
    });

    // Get all users from users table
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, stripe_customer_id')
      .not('stripe_customer_id', 'is', null);

    // Check Stripe for payment methods with card details
    const cardMap: Record<string, { brand: string; last4: string; expMonth: number; expYear: number } | null> = {};

    if (process.env.STRIPE_SECRET_KEY && users && users.length > 0) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia' as any,
      });

      // Batch check payment methods
      await Promise.all(
        users.map(async (u) => {
          if (u.stripe_customer_id) {
            try {
              const methods = await stripe.paymentMethods.list({
                customer: u.stripe_customer_id,
                type: 'card',
                limit: 1,
              });
              if (methods.data.length > 0 && methods.data[0].card) {
                const card = methods.data[0].card;
                cardMap[u.id] = {
                  brand: card.brand,
                  last4: card.last4,
                  expMonth: card.exp_month,
                  expYear: card.exp_year,
                };
              } else {
                cardMap[u.id] = null;
              }
            } catch {
              cardMap[u.id] = null;
            }
          }
        })
      );
    }

    return NextResponse.json({ loginMap, cardMap });
  } catch (error: any) {
    console.error('Error in user-status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
