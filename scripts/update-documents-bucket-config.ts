/**
 * Update documents bucket configuration to allow all necessary MIME types
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateBucketConfig() {
  console.log('🔧 Updating documents bucket configuration...\n');

  const allowedMimeTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/x-icon',
    // Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
    // Design files
    'application/illustrator',
    'application/postscript'
  ];

  try {
    // Update bucket configuration
    const { data, error } = await supabase.storage.updateBucket('documents', {
      public: false,
      fileSizeLimit: 52428800, // 50MB (Supabase default maximum)
      allowedMimeTypes: allowedMimeTypes
    });

    if (error) {
      console.error('❌ Failed to update bucket:', error);
      process.exit(1);
    }

    console.log('✅ Successfully updated documents bucket configuration');
    console.log('\nAllowed MIME types:');
    allowedMimeTypes.forEach(type => console.log(`  - ${type}`));
    console.log(`\nFile size limit: 50MB`);
    console.log(`Public: false`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateBucketConfig()
  .then(() => {
    console.log('\n✅ Bucket configuration updated successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to update bucket configuration:', error);
    process.exit(1);
  });
