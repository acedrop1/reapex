const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixImagePaths() {
  console.log('🔧 Fixing image paths in database...\n');

  // Get all listings
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, images, property_address');

  if (error) {
    console.error('Error fetching listings:', error);
    return;
  }

  let fixedCount = 0;

  for (const listing of listings) {
    if (!listing.images || !Array.isArray(listing.images)) continue;

    const fixedImages = listing.images.map((imgPath) => {
      if (!imgPath) return imgPath;
      
      // If it's already a web path (starts with /), return as is
      if (imgPath.startsWith('/') && !imgPath.startsWith('/Users')) {
        return imgPath;
      }

      // If it's an absolute file system path, convert to relative web path
      if (imgPath.includes('public/images')) {
        const relativePath = imgPath.split('public')[1];
        return relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
      }

      // If it's a full absolute path, extract the public part
      if (imgPath.includes('/public/')) {
        const publicIndex = imgPath.indexOf('/public/');
        return imgPath.substring(publicIndex + '/public'.length);
      }

      return imgPath;
    });

    // Update if paths changed
    if (JSON.stringify(fixedImages) !== JSON.stringify(listing.images)) {
      const { error: updateError } = await supabase
        .from('listings')
        .update({ images: fixedImages })
        .eq('id', listing.id);

      if (updateError) {
        console.error(`❌ Error updating ${listing.property_address}:`, updateError.message);
      } else {
        console.log(`✓ Fixed: ${listing.property_address}`);
        fixedCount++;
      }
    }
  }

  // Fix agent headshots
  console.log('\n🔧 Fixing agent headshot paths...\n');
  const { data: agents } = await supabase
    .from('users')
    .select('id, headshot_url, full_name')
    .eq('role', 'agent');

  let fixedAgents = 0;

  for (const agent of agents || []) {
    if (!agent.headshot_url) continue;

    let fixedPath = agent.headshot_url;

    // If it's an absolute file system path, convert to relative web path
    if (agent.headshot_url.includes('public/images')) {
      const relativePath = agent.headshot_url.split('public')[1];
      fixedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    } else if (agent.headshot_url.includes('/public/')) {
      const publicIndex = agent.headshot_url.indexOf('/public/');
      fixedPath = agent.headshot_url.substring(publicIndex + '/public'.length);
    }

    if (fixedPath !== agent.headshot_url) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ headshot_url: fixedPath })
        .eq('id', agent.id);

      if (updateError) {
        console.error(`❌ Error updating ${agent.full_name}:`, updateError.message);
      } else {
        console.log(`✓ Fixed: ${agent.full_name}`);
        fixedAgents++;
      }
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} listings and ${fixedAgents} agents\n`);
}

fixImagePaths();

