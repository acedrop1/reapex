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
      onClose();
    }
  };

  // Auto-generate a temporary password
  const generatePassword = () => {
    const pw = `Temp${Math.random().toString(36).slice(2, 10)}!${Math.floor(Math.random() * 100)}`;
    setFormData({ ...formData, password: pw });
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to create user');
      }

      onSuccess();
      handleClose();
    } catch (error) {
      showError({
        ...parseError(error),
        title: 'Failed to Create User',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Create New User
          </Typography>
          <IconButton onClick={handleClose} disabled={submitting} size="small">
            <XIcon size={20} />
          </IconButton>
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
            placeholder="agent@re-apex.com"
          />

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              label="Password"
              fullWidth
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={!!errors.password}
              helperText={errors.password || 'Temporary password — user can login with Google OAuth instead'}
              disabled={submitting}
              required
            />
            <Button
              variant="outlined"
              size="small"
              onClick={generatePassword}
              disabled={submitting}
              sx={{ mt: 1, whiteSpace: 'nowrap', minWidth: 'auto', px: 2 }}
            >
              Generate
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
              <MenuItem value="broker">Broker (Admin + Public Profile)</MenuItem>
              <MenuItem value="admin">Admin (Admin Panel Only)</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Account Status</InputLabel>
            <Select
              value={formData.account_status}
              label="Account Status"
              onChange={(e) => setFormData({ ...formData, account_status: e.target.value as AccountStatus })}
              disabled={submitting}
            >
              <MenuItem value="approved">Approved (Active)</MenuItem>
              <MenuItem value="pending">Pending Approval</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="caption">
              If the user has a Google Workspace account (@re-apex.com), they can sign in with "Sign in with Google" instead of using a password.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : <UserPlus size={20} />}
        >
          {submitting ? 'Creating...' : 'Create User'}
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
