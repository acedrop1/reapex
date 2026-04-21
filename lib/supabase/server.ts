import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { MOCK_ADMIN_USER, MOCK_SESSION, MOCK_USER_PROFILE, isAuthBypassed } from '@/lib/dev/mock-user';

export async function createServerComponentClient() {
  const cookieStore = await cookies();

  const client = createServerClient(
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

  // DEVELOPMENT MODE: Inject mock admin user
  if (isAuthBypassed()) {
    // Override auth methods to return mock user
    const originalAuth = client.auth;
    client.auth = {
      ...originalAuth,
      getUser: async () => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { user: MOCK_ADMIN_USER as any },
        error: null,
      }),
      getSession: async () => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { session: MOCK_SESSION as any },
        error: null,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    // Override from() to return mock user profile when querying users table
    const originalFrom = client.from.bind(client);
    client.from = ((table: string) => {
      const query = originalFrom(table);

      if (table === 'users') {
        const originalSelect = query.select.bind(query);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query.select = ((...args: any[]) => {
          const selectQuery = originalSelect(...args);

          // Override single() method to return mock user profile
          if (typeof selectQuery.single === 'function') {
            selectQuery.single = (async () => ({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data: MOCK_USER_PROFILE as any,
              error: null,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            })) as any;
          }

          return selectQuery;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;
      }

      return query;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
  }

  return client;
}

// Alias for API routes
export async function createClient() {
  return createServerComponentClient();
}

// Service role client for bypassing RLS (use with caution!)
// Uses createClient from @supabase/supabase-js directly without cookies
// This ensures the service role key is used for authentication, not JWT tokens
export async function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
