'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Eye, EyeSlash, Lock, CheckCircle } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';

export default function SecurityTab() {
  const supabase = createClient();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async () => {
    setError(null);
    setSuccess(false);

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { label: '', color: '', width: 0 };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { label: 'Weak', color: '#F44336', width: 33 };
    if (score <= 3) return { label: 'Fair', color: '#FF9800', width: 66 };
    return { label: 'Strong', color: '#4CAF50', width: 100 };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <Box>
      <Paper
        sx={{
          backgroundColor: '#121212',
          border: '1px solid #2A2A2A',
          borderRadius: '12px',
          p: 3,
          maxWidth: 500,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Lock size={24} color="#E2C05A" weight="duotone" />
          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
            Change Password
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            icon={<CheckCircle size={20} weight="fill" />}
            sx={{ mb: 2, borderRadius: '8px' }}
          >
            Password updated successfully!
          </Alert>
        )}

        <TextField
          fullWidth
          label="New Password"
          type={showNew ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          sx={{ mb: 1 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowNew(!showNew)} edge="end" sx={{ color: '#808080' }}>
                  {showNew ? <EyeSlash size={20} /> : <Eye size={20} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Password strength bar */}
        {newPassword && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box
                sx={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#2A2A2A',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: `${strength.width}%`,
                    height: '100%',
                    backgroundColor: strength.color,
                    borderRadius: 2,
                    transition: 'width 0.3s, background-color 0.3s',
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: strength.color, minWidth: 40 }}>
                {strength.label}
              </Typography>
            </Box>
          </Box>
        )}

        <TextField
          fullWidth
          label="Confirm New Password"
          type={showConfirm ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          sx={{ mb: 3 }}
          error={confirmPassword.length > 0 && newPassword !== confirmPassword}
          helperText={confirmPassword.length > 0 && newPassword !== confirmPassword ? 'Passwords do not match' : ''}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" sx={{ color: '#808080' }}>
                  {showConfirm ? <EyeSlash size={20} /> : <Eye size={20} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="contained"
          onClick={handleChangePassword}
          disabled={loading || !newPassword || !confirmPassword}
          fullWidth
          sx={{
            backgroundColor: '#E2C05A',
            color: '#0D0D0D',
            fontWeight: 600,
            py: 1.2,
            '&:hover': { backgroundColor: '#C4A43B' },
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: '#0D0D0D' }} /> : 'Update Password'}
        </Button>

        <Typography variant="caption" sx={{ color: '#808080', display: 'block', mt: 2, textAlign: 'center' }}>
          Password must be at least 8 characters. Use a mix of letters, numbers, and symbols for a stronger password.
        </Typography>
      </Paper>
    </Box>
  );
}
