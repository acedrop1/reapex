'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { createClient } from '@/lib/supabase/client';

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      // Update password via Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      // Clear the must_change_password flag
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .update({ must_change_password: false })
          .eq('id', user.id);
      }

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        p: 2,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 440,
          p: 4,
          backgroundColor: '#111111',
          borderRadius: '12px',
          border: '1px solid rgba(226, 192, 90, 0.15)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#d4af37',
              letterSpacing: '1px',
              mb: 1,
            }}
          >
            REAPEX
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: '#FFFFFF', mb: 1 }}
          >
            Set Your New Password
          </Typography>
          <Typography variant="body2" sx={{ color: '#999' }}>
            For security, please create a new password to replace your temporary one.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="New Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="At least 8 characters"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#FFFFFF',
                '& fieldset': { borderColor: 'rgba(226,192,90,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(226,192,90,0.4)' },
                '&.Mui-focused fieldset': { borderColor: '#d4af37' },
              },
              '& .MuiInputLabel-root': { color: '#999' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#d4af37' },
            }}
          />

          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Re-enter your new password"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#FFFFFF',
                '& fieldset': { borderColor: 'rgba(226,192,90,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(226,192,90,0.4)' },
                '&.Mui-focused fieldset': { borderColor: '#d4af37' },
              },
              '& .MuiInputLabel-root': { color: '#999' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#d4af37' },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              backgroundColor: '#d4af37',
              color: '#0a0a0a',
              fontWeight: 700,
              py: 1.5,
              fontSize: '1rem',
              '&:hover': { backgroundColor: '#c49d2f' },
              '&.Mui-disabled': { backgroundColor: 'rgba(212,175,55,0.3)', color: '#666' },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#0a0a0a' }} /> : 'Set Password & Continue'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
