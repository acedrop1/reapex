/**
 * Run Migration 019 - Agent Applications
 *
 * This script runs the agent applications migration directly
 * using the Supabase service role key.
 *
 * Run with: node scripts/run-migration-019.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running Migration 019 - Agent Applications...\n');

  try {
    // Read migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '019_agent_applications.sql'
    );

    console.log('Reading migration file:', migrationPath);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split into individual statements (basic splitting)
    const statements = migrationSQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement,
      });

      if (error) {
        console.error(`Error in statement ${i + 1}:`, error.message);

        // Continue if it's just a "already exists" error
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate')
        ) {
          console.log('  (Continuing - object already exists)');
          continue;
        }

        throw error;
      }

      console.log(`  ✓ Statement ${i + 1} completed`);
    }

    console.log('\n✓ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: node scripts/setup-storage.js');
    console.log('2. Setup storage RLS policies (see docs/AGENT_APPLICATION_SETUP.md)');
    console.log('3. Test the application flow at /join');
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.log('\nAlternative approach:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy contents of supabase/migrations/019_agent_applications.sql');
    console.log('3. Paste and run in SQL Editor');
    process.exit(1);
  }
}

// Check if RPC function exists (it may not, which is fine)
console.log('Note: This script requires the exec_sql RPC function.');
console.log('If it fails, use the Supabase Dashboard SQL Editor instead.\n');

runMigration();
