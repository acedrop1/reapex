'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface FeaturedListing {
  id: string;
  cover_image: string | null;
  images: string[];
  property_address: string;
  property_city: string;
  price: number;
}

interface FeaturedListingsCarouselProps {
  listings: FeaturedListing[];
  autoPlayInterval?: number;
}

export function FeaturedListingsCarousel({
  listings,
  autoPlayInterval = 5000,
}: FeaturedListingsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (listings.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % listings.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [listings.length, autoPlayInterval]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + listings.length) % listings.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % listings.length);
  };

  if (listings.length === 0) {
    return null;
  }

  const currentListing = listings[currentIndex];
  const imageUrl = currentListing.cover_image || currentListing.images?.[0];

  return (
    <Box
      sx={{
        height: '50vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background Images with Transition */}
      {listings.map((listing, index) => {
        const bgImage = listing.cover_image || listing.images?.[0];
        return (
          <Box
            key={listing.id}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: bgImage ? `url(${bgImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: index === currentIndex ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
              zIndex: 0,
            }}
          />
        );
      })}

      {/* Gradient Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(rgba(26, 26, 26, 0.5), rgba(51, 51, 51, 0.5))',
          zIndex: 1,
        }}
      />

      {/* Navigation Arrows */}
      {listings.length > 1 && (
        <>
          <IconButton
            onClick={handlePrevious}
            sx={{
              position: 'absolute',
              left: { xs: 8, md: 24 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            <ChevronLeft sx={{ fontSize: 40 }} />
          </IconButton>
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: { xs: 8, md: 24 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            <ChevronRight sx={{ fontSize: 40 }} />
          </IconButton>
        </>
      )}

      {/* Hero Content - Just Title */}
      <Container
        maxWidth="xl"
        sx={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          color: '#ffffff',
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            mb: 2,
            fontSize: { xs: '2.5rem', md: '3.5rem' },
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          Property Listings
        </Typography>
        <Typography
          variant="h5"
          sx={{
            color: '#e0e0e0',
            fontWeight: 400,
            fontSize: { xs: '1.25rem', md: '1.5rem' },
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          Find your perfect property
        </Typography>
      </Container>

      {/* Carousel Indicators */}
      {listings.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1,
            zIndex: 2,
          }}
        >
          {listings.map((_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: index === currentIndex ? 32 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: index === currentIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#ffffff',
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
