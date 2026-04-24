'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, TextField, Button, Alert, Card } from '@mui/material';
import Link from 'next/link';
import { ReapexLogo } from '@/components/ui/ReapexLogo';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const full_name = formData.get('full_name') as string;
    const confirm_password = formData.get('confirm_password') as string;

    if (password !== confirm_password) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, password, full_name, confirm_password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      if (data.message) {
        setSuccess(true);
        setError(null);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
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
              sx={{ mb: 2, color: '#1a1a1a', fontWeight: 600 }}
            >
              Create your account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 1, mb: 1, width: '100%' }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mt: 1, mb: 1, width: '100%' }}>
                Please check your email to confirm your account before signing in.
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="full_name"
                label="Full Name"
                name="full_name"
                autoComplete="name"
                autoFocus
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#ddd' },
                    '&:hover fieldset': { borderColor: '#d4af37' },
                    '&.Mui-focused fieldset': { borderColor: '#d4af37' },
                  },
                  '& .MuiInputLabel-root': { color: '#999' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#d4af37' },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#ddd' },
                    '&:hover fieldset': { borderColor: '#d4af37' },
                    '&.Mui-focused fieldset': { borderColor: '#d4af37' },
                  },
                  '& .MuiInputLabel-root': { color: '#999' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#d4af37' },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                disabled={loading}
                helperText="Must be at least 6 characters"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#ddd' },
                    '&:hover fieldset': { borderColor: '#d4af37' },
                    '&.Mui-focused fieldset': { borderColor: '#d4af37' },
                  },
                  '& .MuiInputLabel-root': { color: '#999' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#d4af37' },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirm_password"
                label="Confirm Password"
                type="password"
                id="confirm_password"
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#ddd' },
                    '&:hover fieldset': { borderColor: '#d4af37' },
                    '&.Mui-focused fieldset': { borderColor: '#d4af37' },
                  },
                  '& .MuiInputLabel-root': { color: '#999' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#d4af37' },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  fontWeight: 600,
                  backgroundColor: '#d4af37',
                  color: '#0a0a0a',
                  '&:hover': {
                    backgroundColor: '#c49d2f',
                  },
                }}
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
              <Box sx={{ textAlign: 'center' }}>
                <Link href="/login" style={{ textDecoration: 'none' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      '&:hover': { color: '#d4af37' },
                    }}
                  >
                    Already have an account? Sign in
                  </Typography>
                </Link>
              </Box>
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
