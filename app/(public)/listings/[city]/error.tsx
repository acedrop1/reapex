'use client';

import { useEffect } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';
import Link from 'next/link';

export default function CityListingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('City listings error:', error);
  }, [error]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        pt: { xs: 12, md: 14 },
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center' }}>
          <ErrorIcon
            sx={{
              fontSize: 100,
              color: '#d32f2f',
              mb: 3,
            }}
          />
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
            Unable to load city listings
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {error.message.includes('URL') || error.message.includes('city')
              ? 'The city URL is invalid or there are no listings available for this location.'
              : 'An error occurred while loading listings for this city. Please try again.'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={reset}
              sx={{
                backgroundColor: '#1a1a1a',
                '&:hover': {
                  backgroundColor: '#333333',
                },
              }}
            >
              Try Again
            </Button>
            <Button variant="outlined" component={Link} href="/listings">
              Browse All Listings
            </Button>
            <Button variant="text" component={Link} href="/">
              Go Home
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
