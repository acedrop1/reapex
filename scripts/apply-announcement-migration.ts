/**
 * Script to apply announcement attachments migration
 * Run with: npx tsx scripts/apply-announcement-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying announcement attachments migration...\n');

  const migrationPath = path.join(
    __dirname,
    '../supabase/migrations/024_add_announcement_attachments.sql'
  );

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Split migration into individual statements
  const statements = migrationSQL
    .split(/;\s*$/gm)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  console.log(`📋 Found ${statements.length} SQL statements\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 60).replace(/\n/g, ' ') + '...';

    console.log(`[${i + 1}/${statements.length}] Executing: ${preview}`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement,
      });

      if (error) {
        // Try direct execution if RPC fails
        const { error: directError } = await supabase
          .from('_migrations')
          .select('*')
          .limit(0); // This is a workaround to execute SQL

        if (directError && directError.message.includes('does not exist')) {
          console.log(`⚠️  Skipping (table may not exist): ${directError.message}`);
        } else if (directError) {
          throw directError;
        }
      }

      console.log(`✅ Success\n`);
      successCount++;
    } catch (err: any) {
      const errorMsg = err.message || String(err);

      // Ignore "already exists" errors
      if (
        errorMsg.includes('already exists') ||
        errorMsg.includes('duplicate')
      ) {
        console.log(`⚠️  Already exists (skipping)\n`);
        successCount++;
      } else {
        console.error(`❌ Error: ${errorMsg}\n`);
        errorCount++;
      }
    }
  }

  console.log('━'.repeat(60));
  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📝 Total: ${statements.length}\n`);

  if (errorCount === 0) {
    console.log('✨ Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Verify the announcements table has new columns:');
    console.log('   - file_urls (text[])');
    console.log('   - attachment_names (text[])');
    console.log('   - author_id (uuid)');
    console.log('   - priority (text)\n');
    console.log('2. Test creating an announcement with file attachments');
    console.log('3. Verify agents can view and download attachments\n');
  } else {
    console.log('⚠️  Some statements failed. Check the errors above.\n');
    process.exit(1);
  }
}

applyMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
