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
  Autocomplete,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import { X as XIcon, GoogleLogo, UserPlus } from '@phosphor-icons/react';
import type { UserRole, AccountStatus } from '@/types/database';
import { useError } from '@/contexts/ErrorContext';
import { parseError } from '@/lib/utils/errorHandler';
import { ModalErrorBoundary } from './ModalErrorBoundary';

interface WorkspaceUser {
  id: string;
  email: string;
  fullName: string;
  givenName: string;
  familyName: string;
  photoUrl?: string;
  isAdmin: boolean;
  orgUnitPath: string;
  alreadyExists: boolean;
}

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

  // Google Workspace integration state
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [selectedWorkspaceUser, setSelectedWorkspaceUser] = useState<WorkspaceUser | null>(null);
  const [showWorkspaceImport, setShowWorkspaceImport] = useState(true); // Always show workspace import

  // Auto-fetch workspace users when modal opens
  useEffect(() => {
    if (open && workspaceUsers.length === 0 && !loadingWorkspace) {
      fetchWorkspaceUsers();
    }
  }, [open]);

  const handleClose = () => {
    if (!submitting && !loadingWorkspace) {
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'agent',
        account_status: 'approved',
      });
      setErrors({});
      setWorkspaceUsers([]);
      setSelectedWorkspaceUser(null);
      setShowWorkspaceImport(true); // Keep workspace import mode
      onClose();
    }
  };

  // Auto-fetch workspace users when modal opens
  const handleOpen = () => {
    if (open && workspaceUsers.length === 0 && !loadingWorkspace) {
      fetchWorkspaceUsers();
    }
  };

  const fetchWorkspaceUsers = async () => {
    setLoadingWorkspace(true);

    try {
      const response = await fetch('/api/admin/workspace-users');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch workspace users');
      }

      setWorkspaceUsers(data.users || []);
      setShowWorkspaceImport(true);
    } catch (error) {
      showError({
        ...parseError(error),
        title: 'Failed to Load Workspace Users',
      });
    } finally {
      setLoadingWorkspace(false);
    }
  };

  const handleWorkspaceUserSelect = (user: WorkspaceUser | null) => {
    setSelectedWorkspaceUser(user);
    if (user) {
      setFormData({
        ...formData,
        email: user.email,
        full_name: user.fullName,
        // Generate a temporary password (user will use Google OAuth to login)
        password: `Temp${Math.random().toString(36).slice(2, 10)}!`,
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedWorkspaceUser) {
      showError({
        title: 'Validation Error',
        message: 'Please select a user from Google Workspace',
        severity: 'warning',
      });
      return false;
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
        throw new Error(result.error || 'Failed to create user');
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
          {/* Google Workspace Import Section - Always Shown */}
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Google Workspace Users Only
            </Typography>
            <Typography variant="caption">
              All users must be imported from your @re-apex.com Google Workspace. This ensures proper authentication and access control.
            </Typography>
          </Alert>

          {loadingWorkspace ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress size={40} />
              <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                Loading Google Workspace users...
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {workspaceUsers.length > 0
                    ? `${workspaceUsers.filter(u => !u.alreadyExists).length} new users available`
                    : 'No workspace users loaded'
                  }
                </Typography>
                <Button
                  size="small"
                  startIcon={<GoogleLogo size={16} />}
                  onClick={fetchWorkspaceUsers}
                  disabled={loadingWorkspace}
                >
                  Refresh
                </Button>
              </Box>

              <Autocomplete
                options={workspaceUsers}
                value={selectedWorkspaceUser}
                onChange={(_, newValue) => handleWorkspaceUserSelect(newValue)}
                getOptionLabel={(option) => `${option.fullName} (${option.email})`}
                getOptionDisabled={(option) => option.alreadyExists}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Workspace Users"
                    placeholder="Type to search..."
                    required
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ gap: 2 }}>
                    <Avatar src={option.photoUrl} sx={{ width: 32, height: 32 }}>
                      {option.fullName.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{option.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email}
                      </Typography>
                    </Box>
                    {option.alreadyExists && (
                      <Chip label="Already exists" size="small" color="default" />
                    )}
                    {option.isAdmin && (
                      <Chip label="Workspace Admin" size="small" color="primary" />
                    )}
                  </Box>
                )}
                disabled={submitting}
              />

              <Divider sx={{ my: 2 }} />
            </>
          )}

          <TextField
            label="Full Name"
            fullWidth
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            error={!!errors.full_name}
            helperText={errors.full_name || (selectedWorkspaceUser ? 'From Google Workspace' : 'Select a workspace user above')}
            disabled={true}
            required
          />

          <TextField
            label="Email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={!!errors.email}
            helperText={errors.email || (selectedWorkspaceUser ? 'From Google Workspace' : 'Select a workspace user above')}
            disabled={true}
            required
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={!!errors.password}
            helperText="Auto-generated temporary password - user will login with Google OAuth"
            disabled={true}
          />

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

          <Alert severity="success" sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Single Sign-On (SSO) Enabled
            </Typography>
            <Typography variant="caption">
              Users will login using their Google Workspace account (@re-apex.com). They can access the portal immediately after creation using "Sign in with Google".
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting || loadingWorkspace}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || loadingWorkspace || !selectedWorkspaceUser}
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
