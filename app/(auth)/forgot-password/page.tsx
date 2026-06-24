'use client';

import { useState } from 'react';
import { Box, Typography, Button, Alert, Card, TextField } from '@mui/material';
import { ReapexLogo } from '@/components/ui/ReapexLogo';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) throw error;

      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
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

            {sent ? (
              <>
                <Typography
                  component="h2"
                  variant="h6"
                  gutterBottom
                  sx={{ mb: 1, color: '#1a1a1a', fontWeight: 600 }}
                >
                  Check your email
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 3, color: '#666', textAlign: 'center' }}
                >
                  We sent a password reset link to <strong>{email}</strong>.
                  Click the link in the email to reset your password.
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 3, color: '#999', textAlign: 'center', fontSize: '0.8rem' }}
                >
                  Don&apos;t see it? Check your spam folder.
                </Typography>
                <Button
                  component={Link}
                  href="/login"
                  variant="outlined"
                  fullWidth
                  sx={{
                    py: 1.25,
                    fontWeight: 600,
                    borderColor: '#d4af37',
                    color: '#d4af37',
                    '&:hover': {
                      borderColor: '#c49d2f',
                      backgroundColor: 'rgba(212, 175, 55, 0.05)',
                    },
                  }}
                >
                  Back to Sign In
                </Button>
              </>
            ) : (
              <>
                <Typography
                  component="h2"
                  variant="h6"
                  gutterBottom
                  sx={{ mb: 1, color: '#1a1a1a', fontWeight: 600 }}
                >
                  Forgot your password?
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 3, color: '#666', textAlign: 'center' }}
                >
                  Enter the email address associated with your account and
                  we&apos;ll send you a link to reset your password.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mt: 0, mb: 2, width: '100%' }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
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
                        backgroundColor: '#ffffff',
                        '& fieldset': { borderColor: '#ddd' },
                        '&:hover fieldset': { borderColor: '#d4af37' },
                        '&.Mui-focused fieldset': { borderColor: '#d4af37', borderWidth: 2 },
                        '& input': { caretColor: '#d4af37' },
                        '& input:-webkit-autofill': {
                          WebkitBoxShadow: '0 0 0 100px #ffffff inset',
                          WebkitTextFillColor: '#1a1a1a',
                        },
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
                      '&:hover': { backgroundColor: '#c49d2f' },
                    }}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </Box>

                <Button
                  component={Link}
                  href="/login"
                  sx={{
                    mt: 2,
                    color: '#666',
                    fontWeight: 500,
                    textTransform: 'none',
                    '&:hover': { color: '#d4af37' },
                  }}
                >
                  Back to Sign In
                </Button>
              </>
            )}
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
