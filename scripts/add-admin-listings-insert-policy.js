// Script to add admin INSERT policy for listings table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addAdminInsertPolicy() {
  console.log('Adding admin INSERT policy for listings table...');

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE POLICY "Admins can insert listings for any agent"
          ON public.listings FOR INSERT
          WITH CHECK (
              EXISTS (
                  SELECT 1 FROM public.users
                  WHERE id = auth.uid() AND role IN ('admin', 'admin_agent')
              )
          );
    `
  });

  if (error) {
    console.error('Error creating policy:', error);

    // Try alternative: direct SQL execution
    console.log('\nTrying alternative method...');
    const { error: altError } = await supabase
      .from('_sql')
      .select('*')
      .eq('query', `
        CREATE POLICY "Admins can insert listings for any agent"
            ON public.listings FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.users
                    WHERE id = auth.uid() AND role IN ('admin', 'admin_agent')
                )
            );
      `);

    if (altError) {
      console.error('Alternative method also failed:', altError);
      console.log('\n⚠️  Please run this SQL manually in Supabase Dashboard > SQL Editor:\n');
      console.log(`
CREATE POLICY "Admins can insert listings for any agent"
    ON public.listings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'admin_agent')
        )
    );
      `);
      process.exit(1);
    }
  }

  console.log('✅ Successfully added admin INSERT policy for listings table');
  console.log('Admins and admin_agents can now insert listings for any agent');
}

addAdminInsertPolicy();
