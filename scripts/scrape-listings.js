const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchPage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return await response.text();
}

async function downloadImage(url, savePath) {
  try {
    // Skip if already exists
    if (fs.existsSync(savePath)) {
      // Return relative path from public directory (web path)
      const relativePath = savePath.replace(path.join(process.cwd(), 'public'), '');
      return relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    }

    // Create directory if it doesn't exist
    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const response = await fetch(url);
    if (!response.ok) {
      console.log(`⚠️  Failed to download ${url}: ${response.statusText}`);
      return url; // Return original URL if download fails
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(savePath, Buffer.from(buffer));
    
    // Return relative path from public directory (web path)
    // e.g., /images/listings/file.jpg
    const relativePath = savePath.replace(path.join(process.cwd(), 'public'), '');
    return relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  } catch (error) {
    console.log(`⚠️  Error downloading ${url}:`, error.message);
    return url; // Return original URL on error
  }
}

async function downloadListingImages(images, propertyRef) {
  const downloadedImages = [];
  const sanitizedRef = propertyRef.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  
  for (let i = 0; i < Math.min(images.length, 10); i++) {
    const imageUrl = images[i];
    if (!imageUrl) continue;
    
    // Get file extension
    const urlParts = imageUrl.split('?')[0].split('.');
    const ext = urlParts[urlParts.length - 1]?.toLowerCase() || 'jpg';
    const filename = `${sanitizedRef}-${i + 1}.${ext}`;
    const savePath = path.join(process.cwd(), 'public', 'images', 'listings', filename);
    
    const localPath = await downloadImage(imageUrl, savePath);
    downloadedImages.push(localPath);
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return downloadedImages;
}

async function downloadAgentHeadshot(headshotUrl, agentName) {
  if (!headshotUrl) return null;
  
  const sanitizedName = agentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const urlParts = headshotUrl.split('?')[0].split('.');
  const ext = urlParts[urlParts.length - 1]?.toLowerCase() || 'jpg';
  const filename = `agent-${sanitizedName}.${ext}`;
  const savePath = path.join(process.cwd(), 'public', 'images', 'agents', filename);
  
  return await downloadImage(headshotUrl, savePath);
}

function extractListings(html) {
  const $ = cheerio.load(html);
  const listings = [];

  // Find all listing items - try multiple selectors
  $('.item-listing-wrap, .property-item, [data-hz-id]').each((index, element) => {
    const $el = $(element);
    
    // Extract property reference
    const hzId = $el.attr('data-hz-id');
    const propertyRef = hzId ? `Reapex - HZ-${hzId}` : `Reapex - ${Date.now()}-${index}`;

    // Extract address - try multiple selectors
    const addressText = $el.find('.item-title a, .property-title a, h2 a, h3 a').first().text().trim() ||
                       $el.find('.item-address, .property-address').text().trim();
    
    if (!addressText) return; // Skip if no address
    
    const addressParts = addressText.split(',').map(s => s.trim());
    const propertyAddress = addressParts[0] || '';
    const cityState = addressParts[1] || '';
    const cityStateParts = cityState.split(/\s+/);
    const propertyCity = cityStateParts[0] || 'Fort Lee';
    const propertyState = cityStateParts[1] || 'NJ';
    const propertyZip = cityStateParts[2] || '07024';

    // Extract price - try multiple selectors
    const priceText = $el.find('.item-price, .property-price, .price').text().trim();
    const priceMatch = priceText.match(/[\d,]+/);
    const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
    
    if (price === 0) return; // Skip if no price
    
    const isRent = priceText.toLowerCase().includes('rent') || priceText.toLowerCase().includes('/mo') || 
                   priceText.toLowerCase().includes('/month');
    const listingType = isRent ? 'for_rent' : 'for_sale';
    const pricePeriod = isRent && (priceText.includes('/mo') || priceText.includes('/month')) ? 'monthly' : undefined;

    // Extract property type
    const propertyTypeText = ($el.find('.item-type, .property-type').text().trim() || '').toLowerCase();
    let propertyType = 'apartment';
    if (propertyTypeText.includes('house') || propertyTypeText.includes('home') || propertyTypeText.includes('single')) {
      propertyType = 'single_family_home';
    } else if (propertyTypeText.includes('condo')) {
      propertyType = 'condo';
    } else if (propertyTypeText.includes('villa')) {
      propertyType = 'villa';
    } else if (propertyTypeText.includes('office')) {
      propertyType = 'office';
    } else if (propertyTypeText.includes('shop')) {
      propertyType = 'shop';
    } else if (propertyTypeText.includes('studio')) {
      propertyType = 'studio';
    }

    // Extract bedrooms, bathrooms, garages, square feet
    const detailsText = $el.find('.item-amenities, .hz-item-features, .property-features, .item-details').text();
    const bedroomsMatch = detailsText.match(/(\d+)\s*(bed|br|bedroom)/i);
    const bathroomsMatch = detailsText.match(/(\d+)\s*(bath|ba|bathroom)/i);
    const garagesMatch = detailsText.match(/(\d+)\s*(garage|parking)/i);
    const sqftMatch = detailsText.match(/([\d,]+)\s*(sq|sqft|square)/i);
    
    const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : null;
    const bathrooms = bathroomsMatch ? parseInt(bathroomsMatch[1]) : null;
    const garages = garagesMatch ? parseInt(garagesMatch[1]) : null;
    const squareFeet = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : null;

    // Extract images
    const images = [];
    $el.find('img').each((_, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy-src');
      if (src && !src.includes('placeholder') && !src.includes('avatar') && !images.includes(src)) {
        // Convert relative URLs to absolute
        const fullUrl = src.startsWith('http') ? src : `https://re-apex.com${src.startsWith('/') ? '' : '/'}${src}`;
        images.push(fullUrl);
      }
    });

    // Extract agent info
    const agentName = $el.find('.agent-name, .agent-information .agent-name, .agent-details .agent-name').text().trim();
    const agentPhone = $el.find('.agent-phone, .agent-information .agent-phone').text().trim();
    const agentEmail = $el.find('.agent-email, .agent-information .agent-email').text().trim();

    // Check if featured
    const isFeatured = $el.hasClass('featured') || $el.find('.featured-badge, .featured').length > 0;
    const isOpenHouse = $el.find('.open-house, .open-house-badge').length > 0;

    // Extract description
    const description = $el.find('.item-description, .property-description, .item-excerpt').text().trim();

    listings.push({
      property_reference: propertyRef,
      property_address: propertyAddress,
      property_city: propertyCity,
      property_state: propertyState,
      property_zip: propertyZip,
      price,
      price_period: pricePeriod,
      property_type: propertyType,
      listing_type: listingType,
      bedrooms,
      bathrooms,
      garages,
      square_feet: squareFeet,
      description: description || null,
      images: images.slice(0, 10), // Limit to 10 images
      featured: isFeatured,
      open_house: isOpenHouse,
      agent_name: agentName || null,
      agent_email: agentEmail || null,
      agent_phone: agentPhone || null,
    });
  });

  return listings;
}

function extractAgents(html) {
  const $ = cheerio.load(html);
  const agents = [];

  // Extract from agent-grid-container (main structure on agents page)
  $('.agent-grid-container').each((index, element) => {
    const $el = $(element);
    
    // Extract name from h2 tag (most reliable)
    const nameHeading = $el.find('h2 a, h3 a').first();
    let fullName = nameHeading.text().trim();
    
    // If no name in heading, try other methods
    if (!fullName || fullName.length < 3) {
      fullName = $el.find('h2, h3').text().trim() ||
                 $el.find('a[href*="/agent/"]').first().text().trim();
    }
    
    // Fallback: extract from URL slug
    if (!fullName || fullName.length < 3) {
      const agentLink = $el.find('a[href*="/agent/"]').first().attr('href');
      if (agentLink) {
        const slug = agentLink.split('/agent/')[1]?.split('/')[0];
        if (slug) {
          fullName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
      }
    }
    
    if (!fullName || fullName.length < 3 || fullName.toLowerCase().includes('view profile')) return;
      
      // Extract email
      const emailMatch = $el.find('a[href^="mailto:"]').first().attr('href');
      const email = emailMatch ? emailMatch.replace('mailto:', '') : 
                    $el.find('.agent-email, [class*="email"]').text().trim() ||
                    `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.')}@reapex.com`;
      
      // Extract phone
      const phoneMatch = $el.find('a[href^="tel:"]').first().attr('href');
      const phoneText = $el.find('.agent-phone, [class*="phone"], .agent-contact').text().trim();
      const phone = phoneMatch ? phoneMatch.replace('tel:', '') :
                    phoneText.match(/[\d+\-() ]+/)?.[0]?.trim() || null;
      
      // Extract headshot - look in agent-grid-image-wrap first
      let headshotUrl = $el.find('.agent-grid-image-wrap img, .agent-grid-image img').first().attr('src') ||
                        $el.find('.agent-image img, .agent-photo img, .agent-avatar img').first().attr('src') ||
                        $el.find('img').first().attr('src');
      
      // Clean up URL (remove query params and resize params)
      if (headshotUrl) {
        headshotUrl = headshotUrl.split('?')[0]; // Remove query params
        // Get original file URL if available
        const origFile = $el.find('img').first().attr('data-orig-file');
        if (origFile) {
          headshotUrl = origFile.split('?')[0];
        }
      }
      
      const fullHeadshotUrl = headshotUrl && !headshotUrl.includes('placeholder') && !headshotUrl.includes('avatar-default')
                            ? (headshotUrl.startsWith('http') ? headshotUrl : `https://re-apex.com${headshotUrl.startsWith('/') ? '' : '/'}${headshotUrl}`)
                            : null;
      
      // Extract position/title
      const position = $el.find('.agent-list-position').text().trim();
      
      // Extract bio
      const bio = $el.find('.agent-bio, .agent-description, .agent-about, p').text().trim().substring(0, 500);
      const bioWithPosition = position ? `${position}. ${bio}`.substring(0, 500) : bio;

      // Avoid duplicates
      if (!agents.find(a => a.email === email || a.full_name === fullName)) {
        agents.push({
          full_name: fullName,
          email,
          phone: phone || null,
          headshot_url: fullHeadshotUrl || null,
          bio: bioWithPosition || null,
        });
      }
  });

  // Also try to extract from listing pages (agents are often shown there)
  $('.agent-details, .agent-information').each((index, element) => {
    const $el = $(element);
    const fullName = $el.find('.agent-name, .agent-title').text().trim();
    if (!fullName || fullName.length < 3) return;
    
    const email = $el.find('a[href^="mailto:"]').attr('href')?.replace('mailto:', '') ||
                  `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.')}@reapex.com`;
    
    if (!agents.find(a => a.email === email || a.full_name === fullName)) {
      agents.push({
        full_name: fullName,
        email,
        phone: null,
        headshot_url: null,
        bio: null,
      });
    }
  });

  return agents;
}

async function getOrCreateAgent(agentData) {
  // Check if agent exists in users table
  const { data: existingAgent } = await supabase
    .from('users')
    .select('id')
    .eq('email', agentData.email)
    .maybeSingle();

  if (existingAgent) {
    // Update existing agent
    await supabase
      .from('users')
      .update({
        full_name: agentData.full_name,
        phone: agentData.phone,
        headshot_url: agentData.headshot_url,
        bio: agentData.bio,
        role: 'agent',
        is_active: true,
      })
      .eq('id', existingAgent.id);
    return existingAgent.id;
  }

  // Try to create auth user first, then users table entry
  // Note: This requires service role key
  try {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: agentData.email,
      email_confirm: true,
      user_metadata: {
        full_name: agentData.full_name,
      },
    });

    if (authError && authError.message.includes('already registered')) {
      // User exists in auth, get it
      const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
      const user = existingAuthUser?.users?.find(u => u.email === agentData.email);
      if (user) {
        // Create users table entry
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: agentData.email,
            full_name: agentData.full_name,
            phone: agentData.phone,
            headshot_url: agentData.headshot_url,
            bio: agentData.bio,
            role: 'agent',
            is_active: true,
          })
          .select('id')
          .single();
        return newUser?.id;
      }
    }

    if (authUser?.user) {
      // Create users table entry
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: agentData.email,
          full_name: agentData.full_name,
          phone: agentData.phone,
          headshot_url: agentData.headshot_url,
          bio: agentData.bio,
          role: 'agent',
          is_active: true,
        })
        .select('id')
        .single();
      return newUser?.id;
    }
  } catch (error) {
    console.log(`Note: Could not create auth user for ${agentData.email}, will use system agent`);
  }

  // Fallback: use system agent
  const { data: defaultAgent } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'system@reapex.com')
    .maybeSingle();
  
  if (defaultAgent) {
    return defaultAgent.id;
  }
  
  // Create default agent if doesn't exist (this will fail without auth user, but try anyway)
  console.log('Creating system agent...');
  return null; // Will handle in insertListings
}

async function insertListings(listings) {
  console.log(`\nProcessing ${listings.length} listings...\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const listing of listings) {
    try {
      // Download listing images
      console.log(`📥 Downloading images for: ${listing.property_address}...`);
      const downloadedImages = await downloadListingImages(listing.images, listing.property_reference);
      
      // Get or create agent
      let agentId;
      if (listing.agent_name) {
        agentId = await getOrCreateAgent({
          full_name: listing.agent_name,
          email: listing.agent_email || `${listing.agent_name.toLowerCase().replace(/\s+/g, '.')}@reapex.com`,
          phone: listing.agent_phone,
        });
      }
      
      // If no agent ID, try to get any existing agent or skip
      if (!agentId) {
        const { data: anyAgent } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'agent')
          .limit(1)
          .maybeSingle();
        
        if (anyAgent) {
          agentId = anyAgent.id;
        } else {
          console.log(`⚠️  No agent found for listing ${listing.property_reference}, skipping...`);
          skipCount++;
          continue;
        }
      }

      // Insert listing
      const { data, error } = await supabase
        .from('listings')
        .insert({
          agent_id: agentId,
          property_reference: listing.property_reference,
          property_address: listing.property_address,
          property_city: listing.property_city,
          property_state: listing.property_state,
          property_zip: listing.property_zip,
          price: listing.price,
          price_period: listing.price_period,
          property_type: listing.property_type,
          listing_type: listing.listing_type,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          garages: listing.garages,
          square_feet: listing.square_feet,
          description: listing.description,
          images: downloadedImages.length > 0 ? downloadedImages : listing.images, // Use downloaded images or fallback to URLs
          featured: listing.featured,
          open_house: listing.open_house,
          status: 'active',
        })
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation - update with downloaded images
          // Update existing listing with downloaded images
          const { error: updateError } = await supabase
            .from('listings')
            .update({
              images: downloadedImages.length > 0 ? downloadedImages : listing.images,
              featured: listing.featured,
              open_house: listing.open_house,
            })
            .eq('property_reference', listing.property_reference);
          
          if (updateError) {
            console.log(`⏭  Skipped (exists): ${listing.property_address}`);
            skipCount++;
          } else {
            console.log(`✓ Updated images: ${listing.property_address}`);
            successCount++;
          }
        } else {
          console.error(`❌ Error: ${listing.property_address} -`, error.message);
          errorCount++;
        }
      } else {
        console.log(`✓ Inserted: ${listing.property_address} - $${listing.price.toLocaleString()}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${listing.property_reference}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount} inserted, ${skipCount} skipped, ${errorCount} errors\n`);
}

async function insertAgents(agents) {
  console.log(`\nProcessing ${agents.length} agents...\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const agent of agents) {
    try {
      // Download agent headshot
      let headshotPath = agent.headshot_url;
      if (agent.headshot_url) {
        console.log(`📥 Downloading headshot for: ${agent.full_name}...`);
        headshotPath = await downloadAgentHeadshot(agent.headshot_url, agent.full_name);
      }
      
      // Check if agent exists
      const { data: existing } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', agent.email)
        .maybeSingle();

      if (existing) {
        // Update existing agent
        const { error: updateError } = await supabase
          .from('users')
          .update({
            full_name: agent.full_name,
            phone: agent.phone,
            headshot_url: headshotPath,
            bio: agent.bio,
            role: 'agent',
            is_active: true,
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`❌ Error updating ${agent.full_name}:`, updateError.message);
          errorCount++;
        } else {
          console.log(`✓ Updated: ${agent.full_name} (${agent.email})`);
          successCount++;
        }
      } else {
        // Try to create auth user first, then users table entry
        try {
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: agent.email,
            email_confirm: true,
            password: require('crypto').randomBytes(16).toString('hex'),
            user_metadata: {
              full_name: agent.full_name,
            },
          });

          if (authError && !authError.message.includes('already registered')) {
            throw authError;
          }

          // Get user ID (either from new user or existing)
          let userId;
          if (authUser?.user) {
            userId = authUser.user.id;
          } else {
            // User already exists in auth, find it
            const { data: users } = await supabase.auth.admin.listUsers();
            const user = users?.users?.find(u => u.email === agent.email);
            if (user) {
              userId = user.id;
            } else {
              throw new Error('Could not find or create auth user');
            }
          }

          // Insert into users table
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: agent.email,
              full_name: agent.full_name,
              phone: agent.phone,
              headshot_url: headshotPath,
              bio: agent.bio,
              role: 'agent',
              is_active: true,
            });

          if (insertError) {
            if (insertError.code === '23505') {
              // Already exists, update instead
              const { error: updateError } = await supabase
                .from('users')
                .update({
                  full_name: agent.full_name,
                  phone: agent.phone,
                  headshot_url: headshotPath,
                  bio: agent.bio,
                  role: 'agent',
                  is_active: true,
                })
                .eq('id', userId);

              if (updateError) {
                console.error(`❌ Error: ${agent.full_name} -`, updateError.message);
                errorCount++;
              } else {
                console.log(`✓ Upserted: ${agent.full_name} (${agent.email})`);
                successCount++;
              }
            } else {
              console.error(`❌ Error: ${agent.full_name} -`, insertError.message);
              errorCount++;
            }
          } else {
            console.log(`✓ Created: ${agent.full_name} (${agent.email})`);
            successCount++;
          }
        } catch (error) {
          console.error(`❌ Error creating ${agent.full_name}:`, error.message);
          errorCount++;
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${agent.full_name}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount} agents processed, ${skipCount} skipped, ${errorCount} errors\n`);
}

async function main() {
  try {
    console.log('🚀 Starting scrape...\n');
    
    console.log('📥 Fetching listings page...');
    const listingsHtml = await fetchPage('https://re-apex.com/listings-with-elementor/');
    const listings = extractListings(listingsHtml);
    console.log(`Found ${listings.length} listings`);
    
    console.log('\n📥 Fetching agents page...');
    const agentsHtml = await fetchPage('https://re-apex.com/agents-2/');
    const agents = extractAgents(agentsHtml);
    console.log(`Found ${agents.length} agents`);

    // Insert agents first
    if (agents.length > 0) {
      await insertAgents(agents);
    }

    // Then insert listings
    if (listings.length > 0) {
      await insertListings(listings);
    }

    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();

