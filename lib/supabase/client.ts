import { createBrowserClient } from '@supabase/ssr';
import { MOCK_ADMIN_USER, MOCK_SESSION, MOCK_USER_PROFILE } from '@/lib/dev/mock-user';

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // DEVELOPMENT MODE: Inject mock admin user
  // Check if NEXT_PUBLIC_BYPASS_AUTH is set (must be public env var for client-side)
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    console.log('🔓 [DEV MODE] Client-side auth bypassed - logged in as admin@re-apex.com');

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
      onAuthStateChange: (callback: any) => {
        // Immediately trigger callback with mock session
        callback('SIGNED_IN', MOCK_SESSION);
        return {
          data: { subscription: { unsubscribe: () => { } } },
        };
      },
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
