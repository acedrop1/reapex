
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const marketingTemplates = [
    {
        name: 'Business Card',
        category: 'Marketing', // Capitalized to match constraint
        canva_url: 'https://www.canva.com/brand/brand-templates/EAG1I6KC93w',
        description: 'Standard business card template',
        order: 1
    },
    {
        name: 'Yard Sign',
        category: 'Marketing', // Capitalized to match constraint
        canva_url: 'https://www.canva.com/brand/brand-templates/EAG1PgKfRsw',
        description: 'Standard yard sign template',
        order: 2
    },
    {
        name: 'Social Media',
        category: 'Marketing', // Capitalized to match constraint
        canva_url: '', // Coming soon
        description: 'Social media templates',
        order: 3
    },
];

const formTemplates = [
    {
        title: 'Listing Agreement',
        category: 'Forms',
        description: 'Standard listing agreement form',
        order: 1
    },
    {
        title: 'Purchase Agreement',
        category: 'Forms',
        description: 'Standard purchase agreement form',
        order: 2
    },
    {
        title: 'Disclosure Forms',
        category: 'Forms',
        description: 'Property disclosure forms',
        order: 3
    },
    {
        title: 'Property Condition',
        category: 'Forms',
        description: 'Property condition report',
        order: 4
    },
    {
        title: 'Buyer Rep Agreement',
        category: 'Forms',
        description: 'Buyer representation agreement',
        order: 5
    },
    {
        title: 'Addendums',
        category: 'Forms',
        description: 'Common contract addendums',
        order: 6
    },
];

async function migrate() {
    console.log('Starting migration...');

    // Checking for service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminClient = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }) : supabase;

    if (!serviceRoleKey) {
        console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY not found. Operations may fail due to RLS.');
    }

    // 1. Seed Marketing Templates
    console.log('Seeding Canva Templates...');
    for (const template of marketingTemplates) {
        const { data: existing } = await adminClient
            .from('canva_templates')
            .select('id')
            .eq('name', template.name)
            .single();

        if (!existing) {
            const { error } = await adminClient.from('canva_templates').insert({
                ...template,
                template_id: `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}` // Placeholder
            });
            if (error) console.error(`Error inserting ${template.name}:`, error.message);
            else console.log(`Inserted ${template.name}`);
        } else {
            // Try to update order if it exists
            const { error } = await adminClient.from('canva_templates').update({ order: template.order }).eq('id', existing.id);
            if (error) console.log(`Could not update order for ${template.name} (column might be missing):`, error.message);
            else console.log(`Updated order for ${template.name}`);
        }
    }

    // 2. Seed Forms
    console.log('\nSeeding Forms...');

    // Fetch a user to assign ownership
    const { data: users } = await adminClient.from('users').select('id').limit(1);
    const userId = users && users.length > 0 ? users[0].id : null;

    if (userId) {
        for (const form of formTemplates) {
            const { data: existing } = await adminClient
                .from('brokerage_documents')
                .select('id')
                .eq('title', form.title)
                .single();

            if (!existing) {
                const { error } = await adminClient.from('brokerage_documents').insert({
                    ...form,
                    uploaded_by: userId,
                    file_url: 'https://placeholder.com/form.pdf', // Satisfy NOT NULL
                    file_name: `${form.title}.pdf`, // Satisfy NOT NULL
                    file_size: 1024 // Satisfy NOT NULL
                });
                if (error) console.error(`Error inserting ${form.title}:`, error.message);
                else console.log(`Inserted ${form.title}`);
            } else {
                const { error } = await adminClient.from('brokerage_documents').update({ order: form.order }).eq('id', existing.id);
                if (error) console.log(`Could not update order for ${form.title}:`, error.message);
                else console.log(`Updated order for ${form.title}`);
            }
        }
    } else {
        console.log('Skipping Forms insertion: No user found to assign ownership.');
    }

    console.log('\nMigration complete. NOTE: If you saw errors about "column order does not exist", please add an "order" (int4) column to "canva_templates", "brokerage_documents", "training_resources", and "external_links" in Supabase Studio.');
}

migrate();
