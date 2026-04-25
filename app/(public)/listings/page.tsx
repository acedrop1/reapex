import { createServerComponentClient } from '@/lib/supabase/server';
import { Container, Typography, Box, Grid, Card, CardContent, CardMedia, Chip, Button, TextField, InputAdornment } from '@mui/material';
import { MagnifyingGlass, Bed, Bathtub, MapPin } from '@phosphor-icons/react/dist/ssr';
import { SquareFoot } from '@mui/icons-material';
import { FeaturedListingsCarousel } from '@/components/listings/FeaturedListingsCarousel';
import { getPropertyTypeLabelPlural } from '@/lib/utils/propertyTypes';
import Link from 'next/link';

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



export default async function PublicListingsPage({
  searchParams,
}: {
  searchParams: {
    city?: string;
    category?: string;
    min_price?: string;
    max_price?: string;
  };
}) {
  const supabase = await createServerComponentClient();

  // Build query for public listings (show active and sold)
  let query = supabase
    .from('listings')
    .select('*')
    .in('status', ['active', 'sold'])
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  // Apply filters
  if (searchParams.city) {
    query = query.ilike('property_city', `%${searchParams.city}%`);
  }
  if (searchParams.min_price) {
    query = query.gte('price', parseFloat(searchParams.min_price));
  }
  if (searchParams.max_price) {
    query = query.lte('price', parseFloat(searchParams.max_price));
  }



  const { data: listings, error } = await query;

  if (error) {
    console.error('Error fetching listings:', error);
  }

  // Get featured listings for the hero carousel
  const { data: featuredListings } = await supabase
    .from('listings')
    .select('id, slug, cover_image, images, property_address, property_city, price')
    .in('status', ['active', 'sold'])
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fallback to regular listings if no featured ones
  let carouselListings = featuredListings || [];
  if (carouselListings.length === 0) {
    const { data: fallbackListings } = await supabase
      .from('listings')
      .select('id, slug, cover_image, images, property_address, property_city, price')
      .in('status', ['active', 'sold'])
      .order('created_at', { ascending: false })
      .limit(5);
    carouselListings = fallbackListings || [];
  }

  return (
    <>


      {/* Main Content */}
      <Box sx={{ backgroundColor: '#0a0a0a', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="overline"
              sx={{
                color: '#d4af37',
                fontWeight: 700,
                fontSize: '0.875rem',
                letterSpacing: '0.15em',
                mb: 2,
                display: 'block',
              }}
            >
              The Reapex Collection
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '4rem' },
                color: '#ffffff',
                mb: 3,
              }}
            >
              Discover Your
              <Box component="span" sx={{ color: '#d4af37' }}>
                {' '}
                Next Home
              </Box>
            </Typography>
          </Box>



          {/* Search Bar */}
          <Box component="form" action="/listings" method="get" sx={{ mb: 6 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  name="city"
                  placeholder="Search by city or neighborhood..."
                  defaultValue={searchParams.city || ''}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MagnifyingGlass size={20} color="#999999" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#ffffff',
                      backgroundColor: '#141414',
                      '& fieldset': {
                        borderColor: '#333333',
                      },
                      '&:hover fieldset': {
                        borderColor: '#d4af37',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#d4af37',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  name="min_price"
                  placeholder="Min Price"
                  type="number"
                  defaultValue={searchParams.min_price || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#ffffff',
                      backgroundColor: '#141414',
                      '& fieldset': {
                        borderColor: '#333333',
                      },
                      '&:hover fieldset': {
                        borderColor: '#d4af37',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#d4af37',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  name="max_price"
                  placeholder="Max Price"
                  type="number"
                  defaultValue={searchParams.max_price || ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#ffffff',
                      backgroundColor: '#141414',
                      '& fieldset': {
                        borderColor: '#333333',
                      },
                      '&:hover fieldset': {
                        borderColor: '#d4af37',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#d4af37',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={1}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    height: '56px',
                    backgroundColor: '#d4af37',
                    color: '#0a0a0a',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    '&:hover': {
                      backgroundColor: '#c49d2f',
                    },
                  }}
                >
                  <MagnifyingGlass size={20} weight="bold" />
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Results Count */}
          {listings && listings.length > 0 && (
            <Typography
              variant="body1"
              sx={{
                color: '#999999',
                fontFamily: 'DM Sans, sans-serif',
                mb: 4,
              }}
            >
              {listings.length} {listings.length === 1 ? 'Property' : 'Properties'}
            </Typography>
          )}

          {/* Masonry Grid */}
          {listings && listings.length > 0 ? (
            <Box
              sx={{
                columns: { xs: 1, sm: 2, md: 3, lg: 4 },
                columnGap: 3,
              }}
            >
              {listings.map((listing: any) => {
                // Get display image
                const displayImage = listing.cover_image || (listing.images && listing.images.length > 0 ? listing.images[0] : null);

                return (
                  <Link
                    key={listing.id}
                    href={`/listings/${normalizeCity(listing.property_city)}/${listing.slug}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Card
                      sx={{
                        breakInside: 'avoid',
                        mb: 3,
                        backgroundColor: '#141414',
                        border: '1px solid #333333',
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: '#d4af37',
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 32px rgba(212, 175, 55, 0.2)',
                        },
                      }}
                    >
                    {displayImage && (
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          image={displayImage}
                          alt={listing.property_address}
                          sx={{
                            objectFit: 'cover',
                            aspectRatio: listing.square_feet > 3000 ? '16/12' : '16/10',
                          }}
                        />

                      </Box>
                    )}
                    <CardContent sx={{ p: 3 }}>
                      {/* Price */}
                      <Typography
                        variant="h5"
                        sx={{
                                    fontWeight: 700,
                          color: '#ffffff',
                          mb: 2,
                          fontFamily: '"JetBrains Mono", monospace',
                        }}
                      >
                        {listing.price_period
                          ? `$${listing.price.toLocaleString()}/${listing.price_period}`
                          : `$${listing.price.toLocaleString()}`}
                      </Typography>

                      {/* Address */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                        <MapPin size={18} color="#d4af37" style={{ marginTop: 2 }} />
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              color: '#ffffff',
                                      fontWeight: 600,
                              lineHeight: 1.4,
                            }}
                          >
                            {listing.property_address}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#999999',
                                    }}
                          >
                            {listing.property_city}, {listing.property_state}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Property Details */}
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 3,
                          mb: 2,
                          pb: 2,
                          borderBottom: '1px solid #333333',
                        }}
                      >
                        {listing.bedrooms && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Bed size={18} color="#999999" />
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#cccccc',
                                        }}
                            >
                              {listing.bedrooms}
                            </Typography>
                          </Box>
                        )}
                        {listing.bathrooms && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Bathtub size={18} color="#999999" />
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#cccccc',
                                        }}
                            >
                              {listing.bathrooms}
                            </Typography>
                          </Box>
                        )}
                        {listing.square_feet && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SquareFoot sx={{ fontSize: 18, color: '#999999' }} />
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#cccccc',
                                        }}
                            >
                              {listing.square_feet.toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Property Type & Status */}
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          label={getPropertyTypeLabelPlural(listing.property_type)}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(212, 175, 55, 0.1)',
                            color: '#d4af37',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                          }}
                        />
                        {listing.status === 'sold' && (
                          <Chip
                            label="SOLD"
                            size="small"
                            sx={{
                              backgroundColor: '#d32f2f',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                            }}
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                  </Link>
                );
              })}
            </Box>
          ) : (
            <Card
              sx={{
                p: 6,
                backgroundColor: '#141414',
                border: '1px solid #333333',
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h5"
                sx={{
                    color: '#ffffff',
                  mb: 2,
                }}
              >
                No Properties Found
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#999999',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Try adjusting your search filters or check back later for new listings.
              </Typography>
            </Card>
          )}
        </Container>
      </Box>
    </>
  );
}
