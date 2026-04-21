import { createServerClient } from '@supabase/ssr';
import { createBrowserClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase Client Factory
 * Centralized Supabase client creation with proper SSR support
 */

// Environment variables validation
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

/**
 * Create Supabase client for Server Components
 * Use this in Server Components, Server Actions, and Route Handlers
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!,
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
}

/**
 * Create Supabase client for Client Components
 * Use this in Client Components only
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!
  );
}

/**
 * Create Supabase client for API Routes (Pages Router - if needed)
 * This is for backward compatibility with Pages Router
 */
export function createApiSupabaseClient(
  req: { cookies: Record<string, string> },
  res: {
    setHeader: (name: string, value: string) => void;
  }
) {
  return createServerClient(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies).map(([name, value]) => ({
            name,
            value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieValue = `${name}=${value}; ${Object.entries(options || {})
              .map(([key, val]) => `${key}=${val}`)
              .join('; ')}`;
            res.setHeader('Set-Cookie', cookieValue);
          });
        },
      },
    }
  );
}

/**
 * Create Admin Supabase client (bypasses RLS)
 * Use only in trusted server-side contexts
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable
 */
export function createAdminSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for admin client'
    );
  }

  return createBrowserClient(
    SUPABASE_URL!,
    serviceRoleKey
  );
}

/**
 * Type-safe Supabase client types
 */
export type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;
export type SupabaseBrowserClient = ReturnType<typeof createBrowserSupabaseClient>;
export type SupabaseAdminClient = ReturnType<typeof createAdminSupabaseClient>;
