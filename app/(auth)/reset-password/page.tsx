'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Card,
  CircularProgress,
} from '@mui/material';
import { ReapexLogo } from '@/components/ui/ReapexLogo';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // The auth callback already exchanged the code for a session.
    // Verify the user has an active session.
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasSession(true);
      }
      setChecking(false);
    };
    check();
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      // Also clear the must_change_password flag if it was set
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .update({ must_change_password: false })
          .eq('id', user.id);
      }

      setSuccess(true);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

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

            {success ? (
              <Alert severity="success" sx={{ mb: 2, width: '100%' }}>
                Password updated successfully! Redirecting to dashboard...
              </Alert>
            ) : checking ? (
              <>
                <CircularProgress size={40} sx={{ color: '#d4af37', mb: 2 }} />
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Verifying your reset link...
                </Typography>
              </>
            ) : !hasSession ? (
              <>
                <Typography
                  component="h2"
                  variant="h6"
                  gutterBottom
                  sx={{ mb: 1, color: '#1a1a1a', fontWeight: 600 }}
                >
                  Invalid or expired link
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 3, color: '#666', textAlign: 'center' }}
                >
                  This password reset link is invalid or has expired.
                  Please request a new one.
                </Typography>
                <Button
                  component={Link}
                  href="/forgot-password"
                  variant="contained"
                  fullWidth
                  sx={{
                    py: 1.25,
                    fontWeight: 600,
                    backgroundColor: '#d4af37',
                    color: '#0a0a0a',
                    '&:hover': { backgroundColor: '#c49d2f' },
                  }}
                >
                  Request New Link
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
                  Set your new password
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 3, color: '#666', textAlign: 'center' }}
                >
                  Enter a new password for your account.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mt: 0, mb: 2, width: '100%' }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    size="small"
                    placeholder="At least 8 characters"
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        color: '#1a1a1a',
                        backgroundColor: '#ffffff',
                        '& fieldset': { borderColor: '#ddd' },
                        '&:hover fieldset': { borderColor: '#d4af37' },
                        '&.Mui-focused fieldset': { borderColor: '#d4af37', borderWidth: 2 },
                        '& input': { caretColor: '#d4af37' },
                      },
                      '& .MuiInputLabel-root': { color: '#999' },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#d4af37' },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: '#0a0a0a' }} />
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
