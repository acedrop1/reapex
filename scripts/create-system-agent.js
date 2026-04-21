const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSystemAgent() {
  console.log('Creating system agent...');
  
  try {
    // Try to create auth user first (requires service role key)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'system@reapex.com',
      email_confirm: true,
      password: require('crypto').randomBytes(16).toString('hex'), // Random password
      user_metadata: {
        full_name: 'Reapex System',
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('System agent auth user already exists, checking users table...');
        // Get existing auth user
        const { data: users } = await supabase.auth.admin.listUsers();
        const systemUser = users?.users?.find(u => u.email === 'system@reapex.com');
        
        if (systemUser) {
          // Check if exists in users table
          const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('id', systemUser.id)
            .maybeSingle();
          
          if (!existing) {
            // Create users table entry
            const { data, error } = await supabase
              .from('users')
              .insert({
                id: systemUser.id,
                email: 'system@reapex.com',
                full_name: 'Reapex System',
                role: 'agent',
                is_active: true,
              });
            
            if (error) {
              console.error('Error creating users table entry:', error);
            } else {
              console.log('✓ System agent created in users table');
            }
          } else {
            console.log('✓ System agent already exists');
          }
        }
      } else {
        console.error('Error creating auth user:', authError);
      }
    } else if (authUser?.user) {
      // Create users table entry
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: 'system@reapex.com',
          full_name: 'Reapex System',
          role: 'agent',
          is_active: true,
        });
      
      if (error) {
        console.error('Error creating users table entry:', error);
      } else {
        console.log('✓ System agent created successfully');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nNote: You may need to create a system agent manually in Supabase:');
    console.log('1. Go to Authentication > Users');
    console.log('2. Create a user with email: system@reapex.com');
    console.log('3. Then insert into users table with that user ID');
  }
}

createSystemAgent();

