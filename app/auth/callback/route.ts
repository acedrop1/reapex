import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
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
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        const { error, data } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data?.user) {
            const email = data.user.email;

            // Check if email is from allowed domain
            // In dev, allow additional domains via ALLOWED_EMAIL_DOMAINS env var
            const allowedDomains = ['@re-apex.com'];
            const extraDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',').map(d => d.trim()).filter(Boolean);
            if (extraDomains) allowedDomains.push(...extraDomains);

            const isAllowed = email && allowedDomains.some(domain => email.endsWith(domain));
            if (!isAllowed) {
                await supabase.auth.signOut();
                return NextResponse.redirect(`${origin}/login?error=Invalid domain. Only @re-apex.com emails are allowed.`);
            }

            // Check if user exists in database
            const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .select('id, account_status')
                .eq('id', data.user.id)
                .single();

            // User must be manually created by admin before they can log in
            if (!userProfile || profileError) {
                await supabase.auth.signOut();
                return NextResponse.redirect(`${origin}/login?error=Your account has not been set up yet. Please contact your administrator.`);
            }

            // Check if account is suspended
            if (userProfile.account_status === 'suspended') {
                await supabase.auth.signOut();
                return NextResponse.redirect(`${origin}/login?error=Your account has been suspended. Please contact your administrator.`);
            }

            // Trigger initial Google Calendar sync in background
            try {
                // Don't await - let it run in background
                fetch(`${origin}/api/calendar/sync`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': request.headers.get('cookie') || '',
                    },
                    body: JSON.stringify({
                        syncType: 'full',
                        forceFullSync: true,
                    }),
                }).catch((err) => {
                    console.error('Background sync trigger failed:', err);
                });
            } catch (error) {
                console.error('Failed to trigger initial calendar sync:', error);
                // Don't fail login if sync fails
            }

            // All checks passed, create redirect response with session cookies
            const redirectUrl = new URL(next, origin);
            const response = NextResponse.redirect(redirectUrl);

            // Ensure session cookies are set before redirect
            return response;
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=Authentication failed`);
}
