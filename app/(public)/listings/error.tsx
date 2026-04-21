'use client';

import { useEffect } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';
import Link from 'next/link';

export default function ListingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Listings error:', error);
  }, [error]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
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
            Unable to load listing
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {error.message.includes('URL') || error.message.includes('slug')
              ? 'The listing URL is invalid or the property may have been removed.'
              : 'An error occurred while loading this listing. Please try again.'}
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
