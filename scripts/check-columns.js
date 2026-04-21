require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function checkColumns() {
    console.log('Checking external_links table schema...');

    const columnsToCheck = ['description', 'color_hex', 'icon_url', 'category', 'display_order'];

    for (const col of columnsToCheck) {
        const { data, error } = await adminClient
            .from('external_links')
            .select(col)
            .limit(1);

        if (error) {
            console.error(`❌ Column "${col}" missing or error:`, error.message);
        } else {
            console.log(`✅ Column "${col}" exists.`);
        }
    }
}

checkColumns();
