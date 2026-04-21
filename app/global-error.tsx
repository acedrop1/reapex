'use client';

import { useEffect } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
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
                Something went wrong
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {error.message || 'An unexpected error occurred. Please try again.'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
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
                <Button
                  variant="outlined"
                  onClick={() => (window.location.href = '/')}
                >
                  Go Home
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>
      </body>
    </html>
  );
}
