'use client';

import { useState, useEffect } from 'react';
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
  Chip,
  Autocomplete,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { X as XIcon } from '@phosphor-icons/react';
import ImageUpload from '@/components/upload/ImageUpload';
import type { User, UserRole, AccountStatus } from '@/types/database';
import { AGENT_SPECIALTIES } from '@/lib/constants';

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

interface FormData {
  id: string;
  email: string;
  full_name: string;
  title: string;
  role: UserRole;
  account_status: AccountStatus;
  bio: string;
  phone: string;
  email_public: string;
  headshot_url: string;
  social_facebook: string;
  social_instagram: string;
  social_linkedin: string;
  social_tiktok: string;
  social_x: string;
  cap_amount: number;
  current_cap_progress: number;
  years_experience: number;
  specialties: string[];
  is_active: boolean;
  hide_from_listing: boolean;
}

export default function EditUserModal({ open, onClose, onSuccess, user }: EditUserModalProps) {
  const [formData, setFormData] = useState<FormData>({
    id: '',
    email: '',
    full_name: '',
    title: '',
    role: 'agent',
    account_status: 'pending',
    bio: '',
    phone: '',
    email_public: '',
    headshot_url: '',
    social_facebook: '',
    social_instagram: '',
    social_linkedin: '',
    social_tiktok: '',
    social_x: '',
    cap_amount: 0,
    current_cap_progress: 0,
    years_experience: 0,
    specialties: [],
    is_active: true,
    hide_from_listing: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        email: user.email,
        full_name: user.full_name || '',
        title: (user as any).title || '',
        role: user.role,
        account_status: user.account_status,
        bio: user.bio || '',
        phone: (user as any).phone || '',
        email_public: (user as any).email_public || '',
        headshot_url: user.headshot_url || '',
        social_facebook: (user as any).social_facebook || '',
        social_instagram: (user as any).social_instagram || '',
        social_linkedin: (user as any).social_linkedin || '',
        social_tiktok: (user as any).social_tiktok || '',
        social_x: (user as any).social_x || '',
        cap_amount: user.cap_amount || 0,
        current_cap_progress: user.current_cap_progress || 0,
        years_experience: user.years_experience || 0,
        specialties: user.specialties || [],
        is_active: (user as any).is_active ?? true,
        hide_from_listing: (user as any).hide_from_listing || false,
      });
    }
  }, [user]);

  const handleClose = () => {
    if (!submitting) {
      setErrors({});
      setErrorMessage('');
      onClose();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.full_name) {
      newErrors.full_name = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/admin/agents', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user');
      }

      onSuccess();
      handleClose();
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: AccountStatus): 'default' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" component="div">
              Edit User
            </Typography>
            {user && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  label={user.role.toUpperCase()}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={user.account_status.toUpperCase()}
                  size="small"
                  color={getStatusColor(user.account_status)}
                />
              </Box>
            )}
          </Box>
          <IconButton onClick={handleClose} disabled={submitting} size="small">
            <XIcon size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}

          {user?.approved_by && user?.approved_at && (
            <Alert severity="info">
              Approved on {new Date(user.approved_at).toLocaleDateString()}
            </Alert>
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Profile Photo
            </Typography>
            <ImageUpload
              label="Upload Profile Photo"
              bucket="agent-photos"
              folder=""
              currentImage={formData.headshot_url}
              onUpload={(url) => setFormData({ ...formData, headshot_url: url })}
              maxSizeMB={5}
              targetUserId={user?.id}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Full Name"
              fullWidth
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              error={!!errors.full_name}
              helperText={errors.full_name}
              disabled={submitting}
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
            />
          </Box>

          <TextField
            label="Professional Title"
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            disabled={submitting}
            placeholder="e.g., Licensed Realtor, Real Estate Broker, etc."
            helperText="This title will appear above the agent's name on their public profile"
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                disabled={submitting}
              >
                <MenuItem value="agent">Agent</MenuItem>
                <MenuItem value="broker">Broker</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
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
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Phone"
              fullWidth
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={submitting}
              placeholder="(123) 456-7890"
            />

            <TextField
              label="Public Email"
              fullWidth
              value={formData.email_public}
              onChange={(e) => setFormData({ ...formData, email_public: e.target.value })}
              disabled={submitting}
              placeholder="public@example.com"
              helperText="Public-facing email (if different from account email)"
            />
          </Box>

          <TextField
            label="Bio"
            fullWidth
            multiline
            rows={3}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            disabled={submitting}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
            <TextField
              label="Years of Experience"
              type="number"
              fullWidth
              value={formData.years_experience}
              onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
              disabled={submitting}
              helperText="Number of years as a real estate agent"
              inputProps={{ min: 0, max: 50 }}
            />

            <Autocomplete
              multiple
              freeSolo
              options={AGENT_SPECIALTIES}
              value={formData.specialties}
              onChange={(_, newValue) => setFormData({ ...formData, specialties: newValue })}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                    key={index}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Specialties"
                  placeholder="Add specialty"
                  helperText="Select or type to add custom specialties"
                />
              )}
              disabled={submitting}
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Social Media Links
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Facebook"
                fullWidth
                value={formData.social_facebook}
                onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
                disabled={submitting}
                placeholder="https://facebook.com/username"
              />

              <TextField
                label="Instagram"
                fullWidth
                value={formData.social_instagram}
                onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                disabled={submitting}
                placeholder="https://instagram.com/username"
              />

              <TextField
                label="LinkedIn"
                fullWidth
                value={formData.social_linkedin}
                onChange={(e) => setFormData({ ...formData, social_linkedin: e.target.value })}
                disabled={submitting}
                placeholder="https://linkedin.com/in/username"
              />

              <TextField
                label="TikTok"
                fullWidth
                value={formData.social_tiktok}
                onChange={(e) => setFormData({ ...formData, social_tiktok: e.target.value })}
                disabled={submitting}
                placeholder="https://tiktok.com/@username"
              />

              <TextField
                label="X (Twitter)"
                fullWidth
                value={formData.social_x}
                onChange={(e) => setFormData({ ...formData, social_x: e.target.value })}
                disabled={submitting}
                placeholder="https://x.com/username"
              />
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Cap Amount"
              type="number"
              fullWidth
              value={formData.cap_amount}
              onChange={(e) => setFormData({ ...formData, cap_amount: parseFloat(e.target.value) || 0 })}
              disabled={submitting}
            />

            <TextField
              label="Current Cap Progress"
              type="number"
              fullWidth
              value={formData.current_cap_progress}
              onChange={(e) => setFormData({ ...formData, current_cap_progress: parseFloat(e.target.value) || 0 })}
              disabled={submitting}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  disabled={submitting}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Active
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    User can log in and access the platform
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.hide_from_listing}
                  onChange={(e) => setFormData({ ...formData, hide_from_listing: e.target.checked })}
                  disabled={submitting}
                  color="warning"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Hide from Public Listing
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    When enabled, this agent will not appear on the public /agents page
                  </Typography>
                </Box>
              }
            />
          </Box>
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
          startIcon={submitting ? <CircularProgress size={20} /> : null}
        >
          {submitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
