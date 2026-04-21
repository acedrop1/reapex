'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, CardMedia, Chip, Button } from '@mui/material';
import { Home } from '@mui/icons-material';
import { Bed, Bathtub, Garage, Ruler, MapPin } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { getPropertyTypeLabel } from '@/lib/utils/propertyTypes';

interface FeaturedPropertiesSectionProps {
  featuredListings: any[];
}

export function FeaturedPropertiesSection({ featuredListings }: FeaturedPropertiesSectionProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Calculate mobile parallax - starts at right (100px), moves left as you scroll
  const mobileParallaxOffset = Math.max(100 - scrollY / 5, -100);

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        pt: 8,
        pb: 8,
      }}
    >
      {/* Background with mobile parallax */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#f5f5f5',
          transform: {
            xs: `translateX(${mobileParallaxOffset}px)`,
            md: 'none',
          },
          transition: 'transform 0.1s ease-out',
          zIndex: 0,
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ mb: 4, textAlign: 'center', mx: 'auto', maxWidth: 800 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
            Featured Inventory
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Search Reapex Signature Listings by price, amenities or other features.
          </Typography>
        </Box>

        {featuredListings && featuredListings.length > 0 ? (
          <Grid
            container
            spacing={3}
            sx={{
              justifyContent: 'center',
              // Mobile carousel
              '@media (max-width: 599px)': {
                display: 'flex',
                flexWrap: 'nowrap',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                gap: 2,
                px: 2,
              }
            }}
          >
            {featuredListings.map((listing: any) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={listing.id}
                sx={{
                  '@media (max-width: 599px)': {
                    minWidth: '85vw',
                    scrollSnapAlign: 'center',
                  }
                }}
              >
                <Link
                  href={`/property/${listing.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      position: 'relative',
                      border: '2px solid transparent',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                        border: '2px solid #cccccc',
                        transform: 'translateY(-4px)',
                      }
                    }}
                  >
                  <Box sx={{ position: 'relative' }}>
                    {listing.images && listing.images.length > 0 ? (
                      <CardMedia
                        component="img"
                        height="200"
                        image={listing.images[0]}
                        alt={listing.property_address}
                        sx={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 200,
                          backgroundColor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Home sx={{ fontSize: 64, color: '#cccccc' }} />
                      </Box>
                    )}
                    {listing.featured && (
                      <Chip
                        label="Featured"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          backgroundColor: '#1a1a1a',
                          color: '#ffffff',
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
                      <Chip
                        label={getPropertyTypeLabel(listing.property_type)}
                        size="small"
                        sx={{
                          backgroundColor: '#f5f5f5',
                          color: '#1a1a1a',
                          fontWeight: 500,
                        }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {listing.status === 'sold' && (
                          <Chip
                            label="SOLD"
                            size="small"
                            sx={{
                              backgroundColor: '#d32f2f',
                              color: '#ffffff',
                              fontWeight: 700
                            }}
                          />
                        )}
                        {listing.open_house && (
                          <Chip label="Open House" size="small" sx={{ backgroundColor: '#4caf50', color: '#ffffff' }} />
                        )}
                      </Box>
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
                      {listing.price_period
                        ? `$${listing.price.toLocaleString()}/${listing.price_period}`
                        : `$${listing.price.toLocaleString()}`}
                    </Typography>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '1rem', mb: 1 }}>
                      {listing.property_address}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                      <MapPin size={16} weight="regular" />
                      <Typography variant="body2" color="text.secondary">
                        {listing.property_city}, {listing.property_state}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', fontSize: '0.875rem', alignItems: 'center' }}>
                      {listing.bedrooms !== null && listing.bedrooms !== undefined && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Bed size={18} weight="regular" />
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                            {listing.bedrooms}
                          </Typography>
                        </Box>
                      )}
                      {listing.bathrooms !== null && listing.bathrooms !== undefined && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Bathtub size={18} weight="regular" />
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                            {listing.bathrooms}
                          </Typography>
                        </Box>
                      )}
                      {listing.garages !== null && listing.garages !== undefined && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Garage size={18} weight="regular" />
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                            {listing.garages}
                          </Typography>
                        </Box>
                      )}
                      {listing.square_feet && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Ruler size={18} weight="regular" />
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                            {listing.square_feet} Sq Ft
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    {listing.property_reference && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontSize: '0.75rem' }}>
                        Ref: {listing.property_reference}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
                </Link>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No featured properties available at this time. Check back soon!
            </Typography>
          </Card>
        )}
      </Container>
    </Box>
  );
}
