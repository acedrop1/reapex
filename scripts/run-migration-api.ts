import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// This script uses the Supabase Management API to run migrations
// You'll need your Supabase access token

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function runMigrationViaAPI() {
  console.log('🚀 Supabase Migration Runner\n');
  
  // Check for access token
  let accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.log('To get your access token:');
    console.log('1. Go to: https://supabase.com/dashboard/account/tokens');
    console.log('2. Create a new token');
    console.log('3. Copy it\n');
    
    accessToken = await question('Enter your Supabase access token (or press Enter to use Dashboard method): ');
    
    if (!accessToken) {
      console.log('\n📋 Using Dashboard method instead...');
      console.log('\n1. Go to: https://supabase.com/dashboard/project/vwbqtrffvbpkmxfuenrs/sql');
      console.log('2. Click "New Query"');
      console.log('3. Copy contents of: supabase/migrations/001_initial_schema.sql');
      console.log('4. Paste and click "Run"\n');
      rl.close();
      return;
    }
  }

  const projectRef = 'vwbqtrffvbpkmxfuenrs';
  const migrationFile = path.join(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
  const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');

  console.log('\n📦 Executing migration via Management API...\n');

  try {
    // Use Supabase Management API
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: migrationSQL,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log('✅ Migration executed successfully!');
    console.log('Result:', result);
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 Alternative: Run migration manually in Supabase Dashboard');
    console.log('   https://supabase.com/dashboard/project/vwbqtrffvbpkmxfuenrs/sql');
  }

  rl.close();
}

runMigrationViaAPI().catch(console.error);

