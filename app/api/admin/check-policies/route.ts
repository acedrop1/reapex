import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Query to get all policies on listings table
    const { data: policies, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT
            polname as policy_name,
            polcmd as command,
            polpermissive as permissive,
            polroles::regrole[] as roles,
            pg_get_expr(polqual, polrelid) as using_clause,
            pg_get_expr(polwithcheck, polrelid) as with_check_clause
          FROM pg_policy
          WHERE polrelid = 'public.listings'::regclass
          ORDER BY polname;
        `
      })
      .single();

    if (error) {
      // Try alternative query
      const query = `
        SELECT
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'listings'
        ORDER BY policyname;
      `;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
          },
          body: JSON.stringify({ query })
        }
      );

      const data = await response.json();

      return NextResponse.json({
        message: 'Listings table policies',
        policies: data,
        note: 'Check these policies to see if INSERT policy exists'
      });
    }

    return NextResponse.json({
      message: 'Listings table policies',
      policies,
    });

  } catch (error: any) {
    console.error('Check policies error:', error);
    return NextResponse.json({
      error: error.message,
      note: 'Go to Supabase dashboard > SQL editor and run: SELECT * FROM pg_policies WHERE tablename = \'listings\';'
    }, { status: 500 });
  }
}
