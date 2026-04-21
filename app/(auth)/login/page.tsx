'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, Button, Alert, Card } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { ReapexLogo } from '@/components/ui/ReapexLogo';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorMsg = searchParams.get('error');
    if (errorMsg) {
      setError(errorMsg);
    }
  }, [searchParams]);

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'https://www.googleapis.com/auth/calendar.events',
        },
      });

      if (error) {
        throw error;
      }
      // Redirect happens automatically
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        backgroundColor: '#0a0a0a',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
        <Box sx={{ width: '100%', maxWidth: '450px', px: 2 }}>
          <Card
            sx={{
              p: 4,
              backgroundColor: '#ffffff',
              boxShadow: '0 8px 32px rgba(212, 175, 55, 0.2)',
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Box sx={{ mb: 3 }}>
                <ReapexLogo width={180} height={60} variant="dark" />
              </Box>
              <Typography
                component="h2"
                variant="h6"
                gutterBottom
                sx={{ mb: 3, color: '#1a1a1a', fontWeight: 600 }}
              >
                Sign in to your account
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mt: 2, mb: 2, width: '100%' }}>
                  {error}
                </Alert>
              )}

              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleLogin}
                disabled={loading}
                startIcon={<GoogleIcon />}
                sx={{
                  mt: 2,
                  py: 1.5,
                  fontWeight: 600,
                  borderColor: '#ddd',
                  color: '#555',
                  '&:hover': {
                    borderColor: '#d4af37',
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                {loading ? 'Connecting...' : 'Sign in with Google'}
              </Button>

              <Typography
                variant="body2"
                sx={{
                  mt: 3,
                  textAlign: 'center',
                  color: '#666',
                  fontWeight: 500,
                }}
              >
                Join us at Reapex and keep more of your commission
              </Typography>
            </Box>
          </Card>
        </Box>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            backgroundColor: '#0a0a0a',
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
            <Box sx={{ width: '100%', maxWidth: '450px', px: 2 }}>
              <Card
                sx={{
                  p: 4,
                  backgroundColor: '#ffffff',
                  boxShadow: '0 8px 32px rgba(212, 175, 55, 0.2)',
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '200px',
                  }}
                >
                  <Typography sx={{ color: '#1a1a1a' }}>Loading...</Typography>
                </Box>
              </Card>
            </Box>
        </Box>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
