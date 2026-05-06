'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, Button, Alert, Card, TextField, Divider } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { ReapexLogo } from '@/components/ui/ReapexLogo';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
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
                <Alert severity="error" sx={{ mt: 0, mb: 2, width: '100%' }}>
                  {error}
                </Alert>
              )}

              {/* Email & Password Form */}
              <Box component="form" onSubmit={handleEmailLogin} sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  size="small"
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: '#1a1a1a',
                      '& fieldset': { borderColor: '#ddd' },
                      '&:hover fieldset': { borderColor: '#d4af37' },
                      '&.Mui-focused fieldset': { borderColor: '#d4af37' },
                    },
                    '& .MuiInputLabel-root': { color: '#999' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#d4af37' },
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  size="small"
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: '#1a1a1a',
                      '& fieldset': { borderColor: '#ddd' },
                      '&:hover fieldset': { borderColor: '#d4af37' },
                      '&.Mui-focused fieldset': { borderColor: '#d4af37' },
                    },
                    '& .MuiInputLabel-root': { color: '#999' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#d4af37' },
                  }}
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.25,
                    fontWeight: 600,
                    backgroundColor: '#d4af37',
                    color: '#0a0a0a',
                    '&:hover': {
                      backgroundColor: '#c49d2f',
                    },
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Box>

              {/* Divider */}
              <Divider sx={{ width: '100%', my: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#999', px: 1 }}>
                  OR
                </Typography>
              </Divider>

              {/* Google Sign In */}
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleLogin}
                disabled={loading}
                startIcon={<GoogleIcon />}
                sx={{
                  py: 1.25,
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
