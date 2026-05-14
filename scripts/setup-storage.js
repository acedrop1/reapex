/**
 * Setup Storage Bucket for Agent Applications
 *
 * This script creates the storage bucket for agent application documents
 * and sets up the necessary RLS policies.
 *
 * Run with: node scripts/setup-storage.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  console.log('Setting up storage bucket for agent applications...\n');

  try {
    // Create the bucket
    console.log('Creating bucket: agent-application-documents');
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket(
      'agent-application-documents',
      {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      }
    );

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✓ Bucket already exists');
      } else {
        throw bucketError;
      }
    } else {
      console.log('✓ Bucket created successfully');
    }

    // Note: RLS policies for storage are managed through Supabase dashboard or SQL
    console.log('\n⚠️  Storage RLS Policies:');
    console.log('Please ensure the following policies are set in Supabase Dashboard:');
    console.log('1. Anyone can upload (for application submissions)');
    console.log('2. Only admins can read all files');
    console.log('\nSQL for RLS policies:');
    console.log(`
-- Allow public uploads for applications
CREATE POLICY "Anyone can upload application documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'agent-application-documents');

-- Allow admins to read all files
CREATE POLICY "Admins can read all application documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agent-application-documents'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow public to read their own uploaded files (optional)
CREATE POLICY "Public can read application documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'agent-application-documents');
    `);

    console.log('\n✓ Storage setup complete!');
  } catch (error) {
    console.error('Error setting up storage:', error);
    process.exit(1);
  }
}

setupStorage();
