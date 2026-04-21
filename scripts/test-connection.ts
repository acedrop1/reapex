import { createClient } from '@/lib/supabase/client';

export async function testConnection() {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Connection test failed:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Supabase connection successful!');
    return { success: true };
  } catch (err) {
    console.error('Connection test error:', err);
    return { success: false, error: String(err) };
  }
}

// Test script - run with: npx tsx scripts/test-connection.ts
if (require.main === module) {
  testConnection().then(result => {
    if (result.success) {
      console.log('Database is ready!');
      process.exit(0);
    } else {
      console.error('Database not ready. Please run the migration first.');
      process.exit(1);
    }
  });
}

