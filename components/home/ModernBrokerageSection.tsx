'use client';

import { Box, Container, Typography, Button } from '@mui/material';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function ModernBrokerageSection() {
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

  // Calculate parallax offset - adjust the divisor to control the intensity
  // Disable parallax on mobile
  const parallaxOffset = scrollY / 3;

  return (
    <Box
      sx={{
        position: 'relative',
        color: '#ffffff',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Background Image with Parallax */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 0, md: '-20%' },
          left: { xs: 0, md: '-35%' },
          width: { xs: '100%', md: '140%' },
          height: { xs: '100%', md: '140%' },
          backgroundImage: 'url(/111.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: {
            xs: 'none',
            md: `translateX(${parallaxOffset}px)`,
          },
          transition: 'transform 0.1s ease-out',
          zIndex: 0,
        }}
      />

      {/* Dark Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(26, 26, 26, 0.85))',
          zIndex: 1,
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
          <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
            A Modern Brokerage. A True Partnership.
          </Typography>
          <Typography variant="h6" sx={{ color: '#e0e0e0', mb: 4, fontWeight: 400 }}>
            At Reapex, we've replaced the old, rigid model with a platform built on transparency, technology and your profitability.
          </Typography>
          <Button
            component={Link}
            href="/join"
            variant="contained"
            size="large"
            sx={{
              backgroundColor: '#ffffff',
              color: '#1a1a1a',
              px: 4,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            Connect with us!
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
