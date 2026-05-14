'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { X as XIcon, UserPlus } from '@phosphor-icons/react';
import type { UserRole, AccountStatus } from '@/types/database';
import { useError } from '@/contexts/ErrorContext';
import { parseError } from '@/lib/utils/errorHandler';
import { ModalErrorBoundary } from './ModalErrorBoundary';

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  account_status: AccountStatus;
}

function CreateUserModalContent({ open, onClose, onSuccess }: CreateUserModalProps) {
  const { showError } = useError();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    full_name: '',
    role: 'agent',
    account_status: 'approved',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{ emailSent: boolean; tempPassword?: string; fullName: string; email: string } | null>(null);

  // Auto-generate a strong temporary password
  const generatePassword = (): string => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghjkmnpqrstuvwxyz';
    const numbers = '23456789';
    const special = '!@#$%&*';
    const all = uppercase + lowercase + numbers + special;
    let pw = '';
    pw += uppercase[Math.floor(Math.random() * uppercase.length)];
    pw += lowercase[Math.floor(Math.random() * lowercase.length)];
    pw += numbers[Math.floor(Math.random() * numbers.length)];
    pw += special[Math.floor(Math.random() * special.length)];
    for (let i = pw.length; i < 14; i++) {
      pw += all[Math.floor(Math.random() * all.length)];
    }
    return pw.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Auto-generate password when modal opens
  const handleOpen = () => {
    if (open && !formData.password) {
      setFormData(prev => ({ ...prev, password: generatePassword() }));
    }
  };

  // Trigger auto-generate on open
  useState(() => {
    if (open) handleOpen();
  });

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'agent',
        account_status: 'approved',
      });
      setErrors({});
      setSuccessResult(null);
      onClose();
    }
  };

  const handleDone = () => {
    setSuccessResult(null);
    onSuccess();
    handleClose();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to create user');
      }

      // Show success screen with email status
      setSuccessResult({
        emailSent: result.emailSent,
        tempPassword: result.tempPassword,
        fullName: formData.full_name,
        email: formData.email,
      });
    } catch (error) {
      showError({
        ...parseError(error),
        title: 'Failed to Create User',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (successResult) {
    return (
      <Dialog open={open} onClose={handleDone} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div">Agent Account Created</Typography>
            <IconButton onClick={handleDone} size="small"><XIcon size={20} /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {successResult.emailSent ? (
              <Alert severity="success">
                <Typography variant="body2">
                  Welcome email sent to <strong>{successResult.email}</strong> with login credentials. They will be asked to change their password on first login.
                </Typography>
              </Alert>
            ) : (
              <>
                <Alert severity="warning">
                  <Typography variant="body2">
                    Email could not be sent (Resend API key may not be configured). Please share these credentials manually with <strong>{successResult.fullName}</strong>.
                  </Typography>
                </Alert>
                <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, border: '1px solid #ddd' }}>
                  <Typography variant="body2" sx={{ mb: 1 }}><strong>Email:</strong> {successResult.email}</Typography>
                  <Typography variant="body2"><strong>Temporary Password:</strong> <code style={{ backgroundColor: '#e0e0e0', padding: '2px 6px', borderRadius: 4 }}>{successResult.tempPassword}</code></Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  The agent will be asked to set a new password on their first login.
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={handleDone}>Done</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">Create Agent Account</Typography>
          <IconButton onClick={handleClose} disabled={submitting} size="small"><XIcon size={20} /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Full Name"
            fullWidth
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            error={!!errors.full_name}
            helperText={errors.full_name}
            disabled={submitting}
            required
            placeholder="John Doe"
          />

          <TextField
            label="Email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={!!errors.email}
            helperText={errors.email}
            disabled={submitting}
            required
            placeholder="agent@example.com"
          />

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              label="Temporary Password"
              fullWidth
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={!!errors.password}
              helperText={errors.password || 'Auto-generated — agent must change on first login'}
              disabled={submitting}
              required
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => setFormData({ ...formData, password: generatePassword() })}
              disabled={submitting}
              sx={{ mt: 1, whiteSpace: 'nowrap', minWidth: 'auto', px: 2 }}
            >
              Regenerate
            </Button>
          </Box>

          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              label="Role"
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              disabled={submitting}
            >
              <MenuItem value="agent">Agent</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="caption">
              A welcome email with login credentials will be sent to the agent. They will be required to set a new password on their first login.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : <UserPlus size={20} />}
        >
          {submitting ? 'Creating...' : 'Create & Send Invite'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Wrap with ModalErrorBoundary for error handling
export default function CreateUserModal(props: CreateUserModalProps) {
  return (
    <ModalErrorBoundary>
      <CreateUserModalContent {...props} />
    </ModalErrorBoundary>
  );
}
