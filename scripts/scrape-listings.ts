import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface ListingData {
  property_reference: string;
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  price: number;
  price_period?: string;
  property_type: string;
  listing_type: string;
  bedrooms?: number;
  bathrooms?: number;
  garages?: number;
  square_feet?: number;
  description?: string;
  images: string[];
  featured: boolean;
  open_house: boolean;
  agent_name?: string;
  agent_email?: string;
  agent_phone?: string;
}

interface AgentData {
  full_name: string;
  email: string;
  phone?: string;
  headshot_url?: string;
  bio?: string;
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return await response.text();
}

function extractListings(html: string): ListingData[] {
  const $ = cheerio.load(html);
  const listings: ListingData[] = [];

  // Find all listing items
  $('.item-listing-wrap').each((index, element) => {
    const $el = $(element);
    
    // Extract property reference
    const hzId = $el.attr('data-hz-id');
    const propertyRef = hzId ? `Reapex - HZ-${hzId}` : `Reapex - ${index}`;

    // Extract address
    const addressText = $el.find('.item-title a').text().trim();
    const addressParts = addressText.split(',').map(s => s.trim());
    const propertyAddress = addressParts[0] || '';
    const cityState = addressParts[1] || '';
    const cityStateParts = cityState.split(/\s+/);
    const propertyCity = cityStateParts[0] || '';
    const propertyState = cityStateParts[1] || '';
    const propertyZip = cityStateParts[2] || '';

    // Extract price
    const priceText = $el.find('.item-price').text().trim();
    const priceMatch = priceText.match(/[\d,]+/);
    const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
    const isRent = priceText.toLowerCase().includes('rent') || priceText.toLowerCase().includes('/mo');
    const listingType = isRent ? 'for_rent' : 'for_sale';
    const pricePeriod = isRent && priceText.includes('/mo') ? 'monthly' : undefined;

    // Extract property type
    const propertyTypeText = $el.find('.item-type').text().trim().toLowerCase();
    let propertyType = 'apartment';
    if (propertyTypeText.includes('house') || propertyTypeText.includes('home')) {
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
    const detailsText = $el.find('.item-amenities, .hz-item-features').text();
    const bedroomsMatch = detailsText.match(/(\d+)\s*(bed|br|bedroom)/i);
    const bathroomsMatch = detailsText.match(/(\d+)\s*(bath|ba|bathroom)/i);
    const garagesMatch = detailsText.match(/(\d+)\s*(garage|parking)/i);
    const sqftMatch = detailsText.match(/([\d,]+)\s*(sq|sqft|square)/i);
    
    const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : undefined;
    const bathrooms = bathroomsMatch ? parseInt(bathroomsMatch[1]) : undefined;
    const garages = garagesMatch ? parseInt(garagesMatch[1]) : undefined;
    const squareFeet = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : undefined;

    // Extract images
    const images: string[] = [];
    $el.find('img').each((_, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src');
      if (src && !src.includes('placeholder') && !images.includes(src)) {
        images.push(src);
      }
    });

    // Extract agent info
    const agentName = $el.find('.agent-name, .agent-information .agent-name').text().trim();
    const agentPhone = $el.find('.agent-phone, .agent-information .agent-phone').text().trim();
    const agentEmail = $el.find('.agent-email, .agent-information .agent-email').text().trim();

    // Check if featured
    const isFeatured = $el.hasClass('featured') || $el.find('.featured-badge').length > 0;
    const isOpenHouse = $el.find('.open-house, .open-house-badge').length > 0;

    // Extract description
    const description = $el.find('.item-description, .property-description').text().trim();

    if (propertyAddress && price > 0) {
      listings.push({
        property_reference: propertyRef,
        property_address: propertyAddress,
        property_city: propertyCity || 'Fort Lee',
        property_state: propertyState || 'NJ',
        property_zip: propertyZip || '07024',
        price,
        price_period: pricePeriod,
        property_type: propertyType,
        listing_type: listingType,
        bedrooms,
        bathrooms,
        garages,
        square_feet: squareFeet,
        description: description || undefined,
        images: images.slice(0, 10), // Limit to 10 images
        featured: isFeatured,
        open_house: isOpenHouse,
        agent_name: agentName || undefined,
        agent_email: agentEmail || undefined,
        agent_phone: agentPhone || undefined,
      });
    }
  });

  return listings;
}

function extractAgents(html: string): AgentData[] {
  const $ = cheerio.load(html);
  const agents: AgentData[] = [];

  $('.agent-list-wrap, .agent-item').each((index, element) => {
    const $el = $(element);
    
    const fullName = $el.find('.agent-name, h2, h3').text().trim();
    const email = $el.find('.agent-email, a[href^="mailto:"]').attr('href')?.replace('mailto:', '') || 
                  $el.find('.agent-email').text().trim();
    const phone = $el.find('.agent-phone, a[href^="tel:"]').attr('href')?.replace('tel:', '') ||
                  $el.find('.agent-phone').text().trim().replace(/[^\d+()-]/g, '');
    const headshotUrl = $el.find('.agent-image img, .agent-photo img').attr('src') ||
                        $el.find('img').first().attr('src');
    const bio = $el.find('.agent-bio, .agent-description').text().trim();

    if (fullName) {
      agents.push({
        full_name: fullName,
        email: email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@reapex.com`,
        phone: phone || undefined,
        headshot_url: headshotUrl || undefined,
        bio: bio || undefined,
      });
    }
  });

  return agents;
}

async function getOrCreateAgent(agentData: AgentData): Promise<string> {
  // Check if agent exists
  const { data: existingAgent } = await supabase
    .from('users')
    .select('id')
    .eq('email', agentData.email)
    .single();

  if (existingAgent) {
    return existingAgent.id;
  }

  // Create auth user first (we'll need to handle this differently)
  // For now, create a placeholder user
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
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

  if (error) {
    console.error('Error creating agent:', error);
    // Return a default agent ID or create a system agent
    const { data: defaultAgent } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'system@reapex.com')
      .single();
    
    if (defaultAgent) {
      return defaultAgent.id;
    }
    throw error;
  }

  return newUser.id;
}

async function insertListings(listings: ListingData[]) {
  console.log(`Processing ${listings.length} listings...`);

  for (const listing of listings) {
    try {
      // Get or create agent
      let agentId: string;
      if (listing.agent_name) {
        agentId = await getOrCreateAgent({
          full_name: listing.agent_name,
          email: listing.agent_email || `${listing.agent_name.toLowerCase().replace(/\s+/g, '.')}@reapex.com`,
          phone: listing.agent_phone,
        });
      } else {
        // Use default/system agent
        const { data: defaultAgent } = await supabase
          .from('users')
          .select('id')
          .eq('email', 'system@reapex.com')
          .single();
        
        if (!defaultAgent) {
          // Create default agent
          const { data: newDefault } = await supabase
            .from('users')
            .insert({
              email: 'system@reapex.com',
              full_name: 'Reapex System',
              role: 'agent',
              is_active: true,
            })
            .select('id')
            .single();
          agentId = newDefault?.id || '';
        } else {
          agentId = defaultAgent.id;
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
          images: listing.images,
          featured: listing.featured,
          open_house: listing.open_house,
          status: 'active',
        })
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          console.log(`Listing ${listing.property_reference} already exists, skipping...`);
        } else {
          console.error(`Error inserting listing ${listing.property_reference}:`, error);
        }
      } else {
        console.log(`✓ Inserted listing: ${listing.property_address}`);
      }
    } catch (error) {
      console.error(`Error processing listing ${listing.property_reference}:`, error);
    }
  }
}

async function insertAgents(agents: AgentData[]) {
  console.log(`Processing ${agents.length} agents...`);

  for (const agent of agents) {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          email: agent.email,
          full_name: agent.full_name,
          phone: agent.phone,
          headshot_url: agent.headshot_url,
          bio: agent.bio,
          role: 'agent',
          is_active: true,
        }, {
          onConflict: 'email',
        })
        .select('id')
        .single();

      if (error) {
        console.error(`Error inserting agent ${agent.full_name}:`, error);
      } else {
        console.log(`✓ Upserted agent: ${agent.full_name}`);
      }
    } catch (error) {
      console.error(`Error processing agent ${agent.full_name}:`, error);
    }
  }
}

async function main() {
  try {
    console.log('Fetching listings page...');
    const listingsHtml = await fetchPage('https://re-apex.com/listings-with-elementor/');
    const listings = extractListings(listingsHtml);
    console.log(`Found ${listings.length} listings`);
    
    console.log('Fetching agents page...');
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

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

