'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
} from '@phosphor-icons/react';
import { ReapexLogo } from '@/components/ui/ReapexLogo';

export default function UnauthorizedPage() {
  const router = useRouter();

  useEffect(() => {
    // If someone lands here directly, redirect to login after 5 seconds
    const timeout = setTimeout(() => {
      router.push('/login');
    }, 5000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          <Box sx={{ mb: 3 }}>
            <ReapexLogo width={180} height={60} variant="dark" />
          </Box>

          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: '#ffebee',
              mb: 3,
            }}
          >
            <WarningIcon size={40} weight="duotone" color="#d32f2f" />
          </Box>

          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
            Access Not Authorized
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your account has not been set up in our system yet.
          </Typography>

          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>How to get access:</strong>
            </Typography>
            <Typography variant="body2" component="div">
              • Contact your administrator to set up your account
              <br />
              • Accounts must be manually created by RE/APEX administrators
              <br />
              • Only @re-apex.com email addresses are allowed
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Need help? Contact us at{' '}
              <a href="mailto:admin@re-apex.com" style={{ color: '#C4A43B' }}>
                admin@re-apex.com
              </a>
            </Typography>

            <Button
              variant="contained"
              onClick={() => router.push('/login')}
              sx={{
                textTransform: 'none',
                backgroundColor: '#1a1a1a',
                '&:hover': {
                  backgroundColor: '#333333',
                },
              }}
            >
              Back to Login
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
