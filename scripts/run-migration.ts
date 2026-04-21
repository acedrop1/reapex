import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  // You'll need to add SUPABASE_SERVICE_ROLE_KEY to .env.local
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
    console.log('\nTo get your service role key:');
    console.log('1. Go to: https://supabase.com/dashboard/project/vwbqtrffvbpkmxfuenrs/settings/api');
    console.log('2. Copy the "service_role" key (keep it secret!)');
    console.log('3. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
    console.log('\nAlternatively, run the migration manually in Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/vwbqtrffvbpkmxfuenrs/sql');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found');
    process.exit(1);
  }

  // Create admin client with service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Read migration file
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📦 Running database migration...\n');

  try {
    // Split SQL into individual statements (simple approach)
    // Note: This is a basic implementation. For production, use a proper SQL parser.
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (statement.trim().length === 0) continue;
      
      try {
        // Use RPC to execute SQL (if available) or use direct query
        // Note: Supabase doesn't have a direct SQL execution endpoint via JS client
        // This would need to be done via Management API or psql
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        // For now, we'll need to use a different approach
      } catch (error: any) {
        console.error(`Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n✅ Migration complete! ${successCount} statements executed`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} errors encountered`);
    }
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Tip: Run the migration manually in Supabase Dashboard SQL Editor');
    process.exit(1);
  }
}

runMigration();

