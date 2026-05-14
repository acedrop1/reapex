import { createServerComponentClient } from '@/lib/supabase/server';
import { Container, Typography, Box, Grid, Card, CardContent, Chip, Button, Divider, Avatar } from '@mui/material';
import { Home, Bed, Bathroom, Garage, SquareFoot, LocationOn, Phone, Email, CalendarMonth, Description } from '@mui/icons-material';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getPropertyTypeLabel } from '@/lib/utils/propertyTypes';
import Image from 'next/image';
import Link from 'next/link';
import MortgageCalculator from '@/components/property/MortgageCalculator';
import ScheduleTourModal from '@/components/property/ScheduleTourModal';
import CopyEmailButton from '@/components/property/CopyEmailButton';
import ListingFeatures from '@/components/property/ListingFeatures';
import ListingActions from '@/components/property/ListingActions';
import { generateListingSchema, generateBreadcrumbSchema } from '@/lib/seo/jsonLd';

export const dynamic = 'force-dynamic';

// Helper function to denormalize city name for display
function denormalizeCity(city: string): string {
  return city
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default async function ListingDetailPage({
  params,
}: {
  params: { city: string; slug: string };
}) {
  const supabase = await createServerComponentClient();
  const { city, slug } = params;
  const displayCity = denormalizeCity(city);

  // Fetch listing by slug and city with agent information
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      *,
      users:agent_id (
        id,
        full_name,
        email,
        phone,
        headshot_url,
        bio,
        license_number
      )
    `)
    .eq('slug', slug)
    .ilike('property_city', displayCity)
    .in('status', ['active', 'sold'])
    .single();

  if (error || !listing) {
    notFound();
  }

  // Extract agent data - Supabase returns joined data as an array
  const agent = Array.isArray(listing.users) ? listing.users[0] : listing.users;

  // Generate JSON-LD structured data
  const listingSchema = generateListingSchema({
    title: listing.listing_title || listing.property_address,
    slug: listing.slug,
    description: listing.description || undefined,
    property_address: listing.property_address || undefined,
    property_city: listing.property_city || undefined,
    property_state: listing.property_state || undefined,
    property_zip: listing.property_zip || undefined,
    bedrooms: listing.bedrooms || undefined,
    bathrooms: listing.bathrooms || undefined,
    square_feet: listing.square_feet || undefined,
    price: listing.price || undefined,
    images: listing.images || [],
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://reapex.com' },
    { name: 'Listings', url: 'https://reapex.com/listings' },
    { name: displayCity, url: `https://reapex.com/listings/${city}` },
    { name: listing.listing_title || listing.property_address, url: `https://reapex.com/listings/${city}/${listing.slug}` },
  ]);

  return (
    <Box sx={{ backgroundColor: '#0a0a0a', pt: { xs: 12, md: 14 }, pb: 8 }}>
      {/* JSON-LD Structured Data */}
      <Script
        id="listing-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(listingSchema),
        }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <Container maxWidth="xl">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: displayCity, href: `/listings/${city}` },
            { label: getPropertyTypeLabel(listing.property_type), href: `/listings` },
            { label: listing.listing_title || listing.property_address },
          ]}
        />

        {/* Header with Price and Actions */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {listing.status === 'sold' ? (
                <Chip
                  label="SOLD"
                  sx={{
                    backgroundColor: '#d32f2f',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    px: 1,
                    py: 2,
                  }}
                />
              ) : (
                <Chip
                  label={listing.listing_type === 'for_rent' ? 'For Rent' : 'For Sale'}
                  sx={{
                    backgroundColor: '#d4af37',
                    color: '#0a0a0a',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    px: 1,
                    py: 2,
                  }}
                />
              )}
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#ffffff', mb: 1, fontFamily: '"JetBrains Mono", monospace' }}>
              {listing.price_period
                ? `$${listing.price.toLocaleString()}/${listing.price_period}`
                : `$${listing.price.toLocaleString()}`}
            </Typography>
            <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#999999' }}>
              <LocationOn sx={{ fontSize: 20, color: '#d4af37' }} />
              {listing.property_address}, {listing.property_city}, {listing.property_state} {listing.property_zip}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <ListingActions />
        </Box>

        {/* Image Gallery */}
        <Box sx={{ mb: 5 }}>
          {/* Desktop Layout - Main image + 4 grid */}
          <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '250px 250px', gap: 2, height: 500 }}>
            {/* Main large image */}
            {listing.cover_image || (listing.images && listing.images.length > 0) ? (
              <Box sx={{ gridRow: 'span 2', position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                <Image
                  src={listing.cover_image || listing.images[0]}
                  alt={listing.property_address}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                />
              </Box>
            ) : (
              <Box
                sx={{
                  gridRow: 'span 2',
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                }}
              >
                <Home sx={{ fontSize: 120, color: '#cccccc' }} />
              </Box>
            )}

            {/* 4 smaller images in 2x2 grid */}
            {[1, 2, 3, 4].map((position) => {
              const imageIndex = position;
              const hasImage = listing.images && listing.images.length > imageIndex;

              return hasImage ? (
                <Box key={position} sx={{ position: 'relative', borderRadius: 1, overflow: 'hidden' }}>
                  <Image
                    src={listing.images[imageIndex]}
                    alt={`${listing.property_address} - Image ${imageIndex + 1}`}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
              ) : (
                <Box
                  key={position}
                  sx={{
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                  }}
                >
                  <Home sx={{ fontSize: 48, color: '#cccccc' }} />
                </Box>
              );
            })}
          </Box>

          {/* Mobile Carousel */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              gap: 2,
            }}
          >
            {listing.images && listing.images.length > 0 ? (
              listing.images.map((img: string, idx: number) => (
                <Box
                  key={idx}
                  sx={{
                    minWidth: '90vw',
                    height: 300,
                    position: 'relative',
                    borderRadius: 2,
                    overflow: 'hidden',
                    scrollSnapAlign: 'center',
                  }}
                >
                  <Image
                    src={img}
                    alt={`${listing.property_address} - Image ${idx + 1}`}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority={idx === 0}
                  />
                </Box>
              ))
            ) : (
              <Box
                sx={{
                  minWidth: '90vw',
                  height: 300,
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                }}
              >
                <Home sx={{ fontSize: 120, color: '#cccccc' }} />
              </Box>
            )}
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Property Details Grid */}
            <Card
              sx={{
                p: 3,
                mb: 4,
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
              }}
            >
              <Grid container spacing={4}>
                {listing.bedrooms && (
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Bed sx={{ fontSize: 40, color: '#d4af37', mb: 1 }} />
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: '#ffffff' }}>
                        {listing.bedrooms}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#999999' }}>
                        {listing.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {listing.bathrooms && (
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Bathroom sx={{ fontSize: 40, color: '#d4af37', mb: 1 }} />
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: '#ffffff' }}>
                        {listing.bathrooms}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#999999' }}>
                        {listing.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {listing.garages && (
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Garage sx={{ fontSize: 40, color: '#d4af37', mb: 1 }} />
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: '#ffffff' }}>
                        {listing.garages}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#999999' }}>
                        {listing.garages === 1 ? 'Garage' : 'Garages'}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {listing.square_feet && (
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <SquareFoot sx={{ fontSize: 40, color: '#d4af37', mb: 1 }} />
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: '#ffffff' }}>
                        {listing.square_feet.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#999999' }}>
                        Sq Ft
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Card>

            {/* Description */}
            {listing.description && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 2, color: '#ffffff' }}>
                  About This Property
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', color: '#cccccc' }}>
                  {listing.description}
                </Typography>
              </Box>
            )}

            {/* Features & Amenities */}
            <ListingFeatures features={listing.features} />

            {/* Virtual Tour */}
            {listing.virtual_tour_url && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3, color: '#ffffff' }}>
                  Virtual Tour
                </Typography>
                <Card
                  sx={{
                    overflow: 'hidden',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      paddingBottom: '56.25%', // 16:9 aspect ratio
                      height: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <iframe
                      src={listing.virtual_tour_url}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 0,
                      }}
                      allowFullScreen
                      title="Virtual Tour"
                    />
                  </Box>
                </Card>
              </Box>
            )}

            {/* Floor Plans */}
            {listing.floor_plans && listing.floor_plans.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3, color: '#ffffff' }}>
                  Floor Plans
                </Typography>
                <Grid container spacing={3}>
                  {listing.floor_plans.map((plan: any, index: number) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Card
                        sx={{
                          overflow: 'hidden',
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                        }}
                      >
                        <Box sx={{ position: 'relative', height: 300, backgroundColor: '#141414' }}>
                          {plan.image_url ? (
                            <Image
                              src={plan.image_url}
                              alt={plan.title || `Floor Plan ${index + 1}`}
                              fill
                              style={{ objectFit: 'contain' }}
                            />
                          ) : (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                              }}
                            >
                              <Description sx={{ fontSize: 64, color: '#666666' }} />
                            </Box>
                          )}
                        </Box>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#ffffff' }}>
                            {plan.title || `Floor Plan ${index + 1}`}
                          </Typography>
                          {plan.description && (
                            <Typography variant="body2" sx={{ color: '#999999' }}>
                              {plan.description}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Mortgage Calculator */}
            <Box sx={{ mb: 4 }}>
              <MortgageCalculator propertyPrice={listing.price} />
            </Box>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Agent Contact Card */}
            <Card
              sx={{
                p: 3,
                position: 'sticky',
                top: 100,
                backgroundColor: '#141414',
                border: '1px solid #2a2a2a',
                mb: 3,
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3, color: '#ffffff' }}>
                Contact Agent
              </Typography>

              {agent && (
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <Avatar
                    src={agent.headshot_url}
                    alt={agent.full_name}
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                      border: '2px solid #2a2a2a',
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#ffffff' }}>
                    {agent.full_name}
                  </Typography>
                  {agent.license_number && (
                    <Typography variant="caption" sx={{ display: 'block', mb: 2, color: '#999999' }}>
                      License #{agent.license_number}
                    </Typography>
                  )}
                  {agent.bio && (
                    <Typography variant="body2" sx={{ mb: 2, fontSize: '0.875rem', color: '#cccccc' }}>
                      {agent.bio}
                    </Typography>
                  )}
                </Box>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{
                    backgroundColor: '#d4af37',
                    color: '#0a0a0a',
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#c49d2f',
                    },
                  }}
                  startIcon={<Phone />}
                  href={agent?.phone ? `tel:${agent.phone}` : undefined}
                >
                  {agent?.phone || 'Call Agent'}
                </Button>

                {agent?.email && (
                  <CopyEmailButton email={agent.email} />
                )}

                {agent?.id && (
                  <ScheduleTourModal
                    agentId={agent.id}
                    agentName={agent.full_name || 'Agent'}
                    agentEmail={agent.email}
                    listingId={listing.id}
                    listingAddress={listing.property_address}
                  />
                )}
              </Box>

              <Divider sx={{ my: 3, borderColor: '#2a2a2a' }} />

              <Typography variant="caption" sx={{ textAlign: 'center', display: 'block', color: '#999999' }}>
                Interested in this property? Contact us for more information or to schedule a viewing.
              </Typography>
            </Card>

            {/* Property Information Card */}
            <Card
              sx={{
                p: 3,
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2, color: '#ffffff' }}>
                Property Information
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#999999' }}>
                    Property Type
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                    {getPropertyTypeLabel(listing.property_type)}
                  </Typography>
                </Box>

                {listing.mls_number && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#999999' }}>
                      MLS Number
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                      {listing.mls_number}
                    </Typography>
                  </Box>
                )}

                {listing.square_feet && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#999999' }}>
                      Square Footage
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                      {listing.square_feet.toLocaleString()} sqft
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#999999' }}>
                    Status
                  </Typography>
                  <Chip
                    label={listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    size="small"
                    sx={{
                      backgroundColor: listing.status === 'sold' ? '#d32f2f' : '#d4af37',
                      color: listing.status === 'sold' ? '#ffffff' : '#0a0a0a',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
