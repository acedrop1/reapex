'use client';

import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Eye as EyeIcon,
  Trash as TrashIcon,
  Download as DownloadIcon,
  MagnifyingGlass as SearchIcon,
  Archive as ArchiveIcon,
  CheckCircle as CheckCircleIcon,
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';

interface Application {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  license_number: string;
  transactions_12_months: number;
  sales_volume_range: 'under_2m' | '2m_8m' | 'over_8m';
  commission_plans: string[];
  photo_id_url: string | null;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  notes: string | null;
  archived: boolean;
  created_at: string;
}

const statusChipStyles: Record<string, any> = {
  pending: dashboardStyles.chip,
  reviewing: dashboardStyles.chipInfo,
  approved: dashboardStyles.chipSuccess,
  rejected: dashboardStyles.chipError,
};

const salesVolumeLabels: Record<string, string> = {
  under_2m: 'Under $2M',
  '2m_8m': '$2M - $8M',
  over_8m: 'Over $8M',
};

const planLabels: Record<string, string> = {
  launch: 'Launch Plan (80/20)',
  growth: 'Growth Plan (90/10)',
  pro: 'Pro Plan (100%)',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [updateNotes, setUpdateNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [approving, setApproving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' | 'warning' } | null>(null);

  const supabase = createClient();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/applications');
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      const { data } = await response.json();
      setApplications(data || []);
    } catch (err) {
      setError('Failed to load applications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setUpdateStatus(application.status);
    setUpdateNotes(application.notes || '');
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedApplication(null);
    setUpdateStatus('');
    setUpdateNotes('');
  };

  const handleApproveApplication = async () => {
    if (!selectedApplication) return;

    setApproving(true);
    try {
      const response = await fetch(`/api/applications/${selectedApplication.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve application');
      }

      if (result.data?.emailSent) {
        setSnackbar({ message: `Agent approved! Welcome email sent to ${result.data.email}`, severity: 'success' });
      } else {
        // Email failed — show the temp password so admin can relay it
        setSnackbar({
          message: `Agent approved but email failed. Temp password: ${result.data?.tempPassword || 'N/A'}`,
          severity: 'warning',
        });
      }

      await fetchApplications();
      handleCloseDetails();
    } catch (err: any) {
      console.error('Error approving application:', err);
      setSnackbar({ message: err.message || 'Failed to approve application', severity: 'error' });
    } finally {
      setApproving(false);
    }
  };

  const handleUpdateApplication = async () => {
    if (!selectedApplication) return;

    // If changing to approved, use the approve flow
    if (updateStatus === 'approved' && selectedApplication.status !== 'approved') {
      await handleApproveApplication();
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/applications/${selectedApplication.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: updateStatus,
          notes: updateNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application');
      }

      setSnackbar({ message: 'Application updated', severity: 'success' });
      await fetchApplications();
      handleCloseDetails();
    } catch (err) {
      console.error('Error updating application:', err);
      setSnackbar({ message: 'Failed to update application', severity: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete application');
      }

      await fetchApplications();
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application');
    }
  };

  const handleArchiveApplication = async (id: string, archived: boolean) => {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          archived: !archived, // Toggle archived status
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive application');
      }

      await fetchApplications();
    } catch (err) {
      console.error('Error archiving application:', err);
      alert('Failed to archive application');
    }
  };

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    const matchesSearch = searchTerm === '' ||
      `${app.first_name} ${app.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.phone_number.includes(searchTerm) ||
      app.license_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesArchived = showArchived || !app.archived; // Only show non-archived by default

    return matchesSearch && matchesStatus && matchesArchived;
  });

  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0D' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0D0D0D' }}>
      {error && (
        <Alert severity="error" sx={{ mx: 2, mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search/Filter Bar - Sticky */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        p: 2,
        backgroundColor: '#121212',
        borderBottom: '1px solid #2A2A2A',
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        flexShrink: 0,
        alignItems: 'center'
      }}>
        <TextField
          placeholder="Search by name, email, phone, or license..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: '250px', ...dashboardStyles.textField }}
          InputProps={{
            startAdornment: <SearchIcon size={20} color="#B0B0B0" style={{ marginRight: 8 }} />,
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="reviewing">Reviewing</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Checkbox
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              sx={{
                color: '#B0B0B0',
                '&.Mui-checked': {
                  color: '#E2C05A',
                },
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
              Show Archived
            </Typography>
          }
        />
      </Box>

      <TableContainer sx={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: '#121212',
        minHeight: 0,
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#0D0D0D',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#2A2A2A',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: '#333333',
          },
        },
      }}>
        <Table stickyHeader sx={{ ...dashboardStyles.table, minWidth: 800 }}>
          <TableHead sx={dashboardStyles.table}>
            <TableRow sx={dashboardStyles.table}>
              <TableCell sx={dashboardStyles.table}>Name</TableCell>
              <TableCell sx={dashboardStyles.table}>Email</TableCell>
              <TableCell sx={dashboardStyles.table}>Phone</TableCell>
              <TableCell sx={dashboardStyles.table}>License #</TableCell>
              <TableCell sx={dashboardStyles.table}>Status</TableCell>
              <TableCell sx={dashboardStyles.table}>Submitted</TableCell>
              <TableCell sx={dashboardStyles.table}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={dashboardStyles.table}>
            {filteredApplications.length === 0 ? (
              <TableRow sx={dashboardStyles.table}>
                <TableCell colSpan={7} align="center" sx={{ ...dashboardStyles.table, py: 4 }}>
                  <Typography variant="body1" sx={{ color: '#808080' }}>
                    {searchTerm || statusFilter !== 'all' ? 'No applications match your filters' : 'No applications yet'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((application) => (
                <TableRow
                  key={application.id}
                  sx={{
                    ...dashboardStyles.table,
                    '&:hover': {
                      backgroundColor: 'rgba(226, 192, 90, 0.04)',
                    },
                  }}
                >
                  <TableCell sx={dashboardStyles.table}>
                    {application.first_name} {application.last_name}
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>{application.email}</TableCell>
                  <TableCell sx={dashboardStyles.table}>{application.phone_number}</TableCell>
                  <TableCell sx={dashboardStyles.table}>{application.license_number}</TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    <Chip
                      label={application.status}
                      size="small"
                      sx={{
                        ...statusChipStyles[application.status],
                        textTransform: 'capitalize',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>{format(new Date(application.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(application)}
                        sx={{
                          color: '#E2C05A',
                          '&:hover': {
                            backgroundColor: 'rgba(226, 192, 90, 0.08)',
                          },
                        }}
                      >
                        <EyeIcon size={20} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleArchiveApplication(application.id, application.archived)}
                        sx={{
                          color: application.archived ? '#FFB74D' : '#B0B0B0',
                          '&:hover': {
                            backgroundColor: 'rgba(176, 176, 176, 0.08)',
                          },
                        }}
                        title={application.archived ? 'Unarchive' : 'Archive'}
                      >
                        <ArchiveIcon size={20} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteApplication(application.id)}
                        sx={{
                          color: '#E57373',
                          '&:hover': {
                            backgroundColor: 'rgba(229, 115, 115, 0.08)',
                          },
                        }}
                      >
                        <TrashIcon size={20} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Application Details
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {selectedApplication && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Personal Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      First Name
                    </Typography>
                    <Typography variant="body1">{selectedApplication.first_name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Last Name
                    </Typography>
                    <Typography variant="body1">{selectedApplication.last_name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">{selectedApplication.email}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1">{selectedApplication.phone_number}</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Professional Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      License Number
                    </Typography>
                    <Typography variant="body1">{selectedApplication.license_number}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Transactions (12 months)
                    </Typography>
                    <Typography variant="body1">
                      {selectedApplication.transactions_12_months}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Sales Volume
                    </Typography>
                    <Typography variant="body1">
                      {salesVolumeLabels[selectedApplication.sales_volume_range]}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Commission Plans of Interest
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedApplication.commission_plans.map((plan) => (
                    <Chip
                      key={plan}
                      label={planLabels[plan]}
                      sx={dashboardStyles.chipInfo}
                    />
                  ))}
                </Box>
              </Box>

              {selectedApplication.photo_id_url && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Photo ID
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon size={20} />}
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/applications/document-url', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: selectedApplication.photo_id_url }),
                        });
                        const { signedUrl } = await res.json();
                        window.open(signedUrl || selectedApplication.photo_id_url, '_blank');
                      } catch {
                        window.open(selectedApplication.photo_id_url!, '_blank');
                      }
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    View Document
                  </Button>
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={updateStatus}
                    label="Status"
                    onChange={(e) => setUpdateStatus(e.target.value)}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="reviewing">Reviewing</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Notes"
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', px: 3, py: 2 }}>
          <Button onClick={handleCloseDetails} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          {updateStatus === 'approved' && selectedApplication?.status !== 'approved' ? (
            <Button
              variant="contained"
              onClick={handleUpdateApplication}
              disabled={approving || updating}
              startIcon={approving ? <CircularProgress size={16} /> : <CheckCircleIcon size={18} />}
              sx={{
                backgroundColor: '#2e7d32',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#1b5e20',
                },
              }}
            >
              {approving ? 'Creating Account...' : 'Approve & Create Account'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleUpdateApplication}
              disabled={updating}
              sx={{
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#333333',
                },
              }}
            >
              {updating ? 'Updating...' : 'Update Application'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      {snackbar && (
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(null)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            minWidth: 300,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {snackbar.message}
        </Alert>
      )}
    </Box>
  );
}
