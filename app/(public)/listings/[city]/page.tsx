import { createServerComponentClient } from '@/lib/supabase/server';
import { Container, Typography, Box, Grid, Card, CardContent, CardMedia, Chip, Button, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Tabs, Tab } from '@mui/material';
import { Search, Home, Tune } from '@mui/icons-material';
import { FeaturedListingsCarousel } from '@/components/listings/FeaturedListingsCarousel';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getPropertyTypeLabelPlural } from '@/lib/utils/propertyTypes';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Helper function to normalize city name for URL
function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Helper function to denormalize city name for display
function denormalizeCity(city: string): string {
  return city
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default async function CityListingsPage({
  params,
  searchParams,
}: {
  params: { city: string };
  searchParams: {
    type?: string;
    listing_type?: string;
    min_bedrooms?: string;
    max_bedrooms?: string;
    min_bathrooms?: string;
    max_bathrooms?: string;
    min_price?: string;
    max_price?: string;
    min_sqft?: string;
    max_sqft?: string;
    pet_friendly?: string;
    pool?: string;
    gym?: string;
  };
}) {
  const supabase = await createServerComponentClient();
  const cityParam = params.city;
  const displayCity = denormalizeCity(cityParam);

  // Build query for city-specific listings (show active and sold)
  let query = supabase
    .from('listings')
    .select('*')
    .in('status', ['active', 'sold'])
    .ilike('property_city', displayCity)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  // Apply filters
  if (searchParams.type) {
    query = query.eq('property_type', searchParams.type);
  }
  if (searchParams.listing_type) {
    query = query.eq('listing_type', searchParams.listing_type);
  }
  if (searchParams.min_bedrooms) {
    query = query.gte('bedrooms', parseInt(searchParams.min_bedrooms));
  }
  if (searchParams.max_bedrooms) {
    query = query.lte('bedrooms', parseInt(searchParams.max_bedrooms));
  }
  if (searchParams.min_bathrooms) {
    query = query.gte('bathrooms', parseInt(searchParams.min_bathrooms));
  }
  if (searchParams.max_bathrooms) {
    query = query.lte('bathrooms', parseInt(searchParams.max_bathrooms));
  }
  if (searchParams.min_price) {
    query = query.gte('price', parseFloat(searchParams.min_price));
  }
  if (searchParams.max_price) {
    query = query.lte('price', parseFloat(searchParams.max_price));
  }
  if (searchParams.min_sqft) {
    query = query.gte('square_feet', parseInt(searchParams.min_sqft));
  }
  if (searchParams.max_sqft) {
    query = query.lte('square_feet', parseInt(searchParams.max_sqft));
  }
  // Feature filters
  if (searchParams.pet_friendly === 'true') {
    query = query.eq('features->>petFriendly', 'true');
  }
  if (searchParams.pool === 'true') {
    query = query.eq('features->>pool', 'true');
  }
  if (searchParams.gym === 'true') {
    query = query.eq('features->>gym', 'true');
  }

  const { data: listings, error } = await query;

  if (error) {
    console.error('Error fetching listings:', error);
  }

  // If no listings found for this city, show 404
  if (!listings || listings.length === 0) {
    notFound();
  }

  // Get featured listings for the hero carousel (city-specific)
  const { data: featuredListings } = await supabase
    .from('listings')
    .select('id, slug, cover_image, images, property_address, property_city, price')
    .eq('status', 'active')
    .eq('featured', true)
    .ilike('property_city', displayCity)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fallback to regular city listings if no featured ones
  let carouselListings = featuredListings || [];
  if (carouselListings.length === 0) {
    const { data: fallbackListings } = await supabase
      .from('listings')
      .select('id, slug, cover_image, images, property_address, property_city, price')
      .eq('status', 'active')
      .ilike('property_city', displayCity)
      .order('created_at', { ascending: false })
      .limit(5);
    carouselListings = fallbackListings || [];
  }


  return (
    <>
      {/* Hero Carousel with Featured Listings */}
      <FeaturedListingsCarousel listings={carouselListings} />

      {/* Main Content */}
      <Box sx={{ backgroundColor: '#0a0a0a', py: 8 }}>
        <Container maxWidth="xl">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: 'Listings', href: '/listings' },
              { label: displayCity },
            ]}
          />

          {/* Page Header */}
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, mb: 1, color: '#ffffff' }}>
            Properties in {displayCity}
          </Typography>
          <Typography variant="body1" gutterBottom sx={{ mb: 4, color: '#999999' }}>
            {listings?.length || 0} {listings?.length === 1 ? 'property' : 'properties'} available
          </Typography>

          {/* Tabs for Listing Types */}
          <Box sx={{ borderBottom: 1, borderColor: '#2a2a2a', mb: 4 }}>
            <Tabs
              value={searchParams.listing_type || ''}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#999999',
                  '&.Mui-selected': {
                    color: '#d4af37',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#d4af37',
                },
              }}
            >
              <Tab label="All Properties" value="" component={Link} href={`/listings/${cityParam}`} />
              <Tab label="For Sale" value="for_sale" component={Link} href={`/listings/${cityParam}?listing_type=for_sale`} />
              <Tab label="For Rent" value="for_rent" component={Link} href={`/listings/${cityParam}?listing_type=for_rent`} />
            </Tabs>
          </Box>

          {/* Search Filters */}
          <Box component="form" action={`/listings/${cityParam}`} method="get" sx={{ mb: 4 }}>
            {/* Preserve listing_type in hidden field */}
            {searchParams.listing_type && (
              <input type="hidden" name="listing_type" value={searchParams.listing_type} />
            )}

            {/* Basic Filters */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#999999', '&.Mui-focused': { color: '#d4af37' } }}>Property Type</InputLabel>
                  <Select
                    name="type"
                    defaultValue={searchParams.type || ''}
                    label="Property Type"
                    sx={{
                      color: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2a2a2a' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#d4af37' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#d4af37' },
                      '& .MuiSvgIcon-root': { color: '#999999' },
                    }}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="house">Houses</MenuItem>
                    <MenuItem value="townhome">Townhomes</MenuItem>
                    <MenuItem value="multi_family">Multi-family</MenuItem>
                    <MenuItem value="condo">Condos/Co-ops</MenuItem>
                    <MenuItem value="apartment">Apartments</MenuItem>
                    <MenuItem value="commercial">Commercial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#999999', '&.Mui-focused': { color: '#d4af37' } }}>Bedrooms</InputLabel>
                  <Select
                    name="min_bedrooms"
                    defaultValue={searchParams.min_bedrooms || ''}
                    label="Bedrooms"
                    sx={{
                      color: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2a2a2a' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#d4af37' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#d4af37' },
                      '& .MuiSvgIcon-root': { color: '#999999' },
                    }}
                  >
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="1">1+</MenuItem>
                    <MenuItem value="2">2+</MenuItem>
                    <MenuItem value="3">3+</MenuItem>
                    <MenuItem value="4">4+</MenuItem>
                    <MenuItem value="5">5+</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#999999', '&.Mui-focused': { color: '#d4af37' } }}>Bathrooms</InputLabel>
                  <Select
                    name="min_bathrooms"
                    defaultValue={searchParams.min_bathrooms || ''}
                    label="Bathrooms"
                    sx={{
                      color: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2a2a2a' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#d4af37' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#d4af37' },
                      '& .MuiSvgIcon-root': { color: '#999999' },
                    }}
                  >
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="1">1+</MenuItem>
                    <MenuItem value="2">2+</MenuItem>
                    <MenuItem value="3">3+</MenuItem>
                    <MenuItem value="4">4+</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="min_price"
                  label="Min Price"
                  type="number"
                  defaultValue={searchParams.min_price || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#ffffff',
                      '& fieldset': { borderColor: '#2a2a2a' },
                      '&:hover fieldset': { borderColor: '#d4af37' },
                      '&.Mui-focused fieldset': { borderColor: '#d4af37' },
                    },
                    '& .MuiInputLabel-root': { color: '#999999' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#d4af37' },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="max_price"
                  label="Max Price"
                  type="number"
                  defaultValue={searchParams.max_price || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#ffffff',
                      '& fieldset': { borderColor: '#2a2a2a' },
                      '&:hover fieldset': { borderColor: '#d4af37' },
                      '&.Mui-focused fieldset': { borderColor: '#d4af37' },
                    },
                    '& .MuiInputLabel-root': { color: '#999999' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#d4af37' },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    backgroundColor: '#d4af37',
                    color: '#0a0a0a',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#c49d2f',
                    },
                  }}
                >
                  <Tune sx={{ mr: 1 }} />
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Listings Grid */}
          {listings && listings.length > 0 ? (
            <>
              <Grid container spacing={3}>
                {listings.map((listing: any) => (
                  <Grid item xs={12} sm={6} lg={4} key={listing.id}>
                    <Link
                      href={`/listings/${normalizeCity(listing.property_city)}/${listing.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 32px rgba(212, 175, 55, 0.2)',
                          },
                        }}
                      >
                      <CardMedia
                        component="img"
                        height="240"
                        image={listing.cover_image || listing.images?.[0] || '/placeholder-property.jpg'}
                        alt={listing.property_address}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Chip
                            label={getPropertyTypeLabelPlural(listing.property_type)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {listing.status === 'sold' && (
                              <Chip
                                label="SOLD"
                                size="small"
                                sx={{
                                  backgroundColor: '#d32f2f',
                                  color: '#fff',
                                  fontWeight: 700
                                }}
                              />
                            )}
                            {listing.featured && (
                              <Chip label="Featured" size="small" color="secondary" />
                            )}
                          </Box>
                        </Box>
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                          {listing.price_period
                            ? `$${listing.price.toLocaleString()}/${listing.price_period}`
                            : `$${listing.price.toLocaleString()}`}
                        </Typography>
                        <Typography variant="body1" gutterBottom sx={{ fontWeight: 600 }}>
                          {listing.property_address}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {listing.property_city}, {listing.property_state} {listing.property_zip}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                          {listing.bedrooms && (
                            <Typography variant="body2">
                              {listing.bedrooms} {listing.bedrooms === 1 ? 'Bed' : 'Beds'}
                            </Typography>
                          )}
                          {listing.bathrooms && (
                            <Typography variant="body2">
                              {listing.bathrooms} {listing.bathrooms === 1 ? 'Bath' : 'Baths'}
                            </Typography>
                          )}
                          {listing.square_feet && (
                            <Typography variant="body2">
                              {listing.square_feet.toLocaleString()} Sq Ft
                            </Typography>
                          )}
                        </Box>
                        {listing.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                          >
                            {listing.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                    </Link>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" align="center" gutterBottom>
                  No Properties Found in {displayCity}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Try adjusting your search filters or{' '}
                  <Link href="/listings" style={{ color: 'inherit', textDecoration: 'underline' }}>
                    view all listings
                  </Link>
                  .
                </Typography>
              </CardContent>
            </Card>
          )}
        </Container>
      </Box>
    </>
  );
}
