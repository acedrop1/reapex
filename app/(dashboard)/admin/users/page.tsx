'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
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
  Alert,
  CircularProgress,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  PencilSimple as EditIcon,
  Trash as DeleteIcon,
  MagnifyingGlass as SearchIcon,
  UserPlus as UserPlusIcon,
  CheckCircle as ApproveIcon,
  Prohibit as SuspendIcon,
  FileText as FileTextIcon,
  Eye as EyeIcon,
  EyeSlash as EyeSlashIcon,
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import CreateUserModal from '@/components/modals/CreateUserModal';
import EditUserModal from '@/components/modals/EditUserModal';
import ManageAgreementsModal from '@/components/modals/ManageAgreementsModal';
import type { User, AccountStatus } from '@/types/database';
import { isAdmin } from '@/lib/utils/auth';

const accountStatusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'approved', label: 'Approved' },
  { value: 'suspended', label: 'Suspended' },
];

const getStatusColor = (status: AccountStatus): 'default' | 'success' | 'warning' | 'error' => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'suspended':
      return 'error';
    default:
      return 'default';
  }
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [agreementsModalOpen, setAgreementsModalOpen] = useState(false);
  const [selectedAgentForAgreements, setSelectedAgentForAgreements] = useState<{ id: string; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const supabase = createClient();

  // Check if user is admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userProfile || !['admin', 'broker'].includes(userProfile.role)) {
        router.push('/dashboard');
      }
    };

    checkAdminAccess();
  }, [router, supabase]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users via API endpoint (which uses admin credentials to bypass RLS)
      const response = await fetch('/api/admin/agents');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch users');
      }

      setUsers(result.data || []);
      setFilteredUsers(result.data || []);
    } catch (err: any) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.account_status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        user =>
          user.full_name?.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
      );
    }

    setFilteredUsers(filtered);
  }, [users, statusFilter, searchTerm]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleManageAgreements = (user: User) => {
    setSelectedAgentForAgreements({ id: user.id, name: user.full_name || user.email });
    setAgreementsModalOpen(true);
  };

  const handleUpdateAccountStatus = async (userId: string, account_status: AccountStatus) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, account_status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user status');
      }

      await fetchUsers();
    } catch (err: any) {
      console.error('Error updating user status:', err);
      alert('Failed to update user status: ' + err.message);
    }
  };

  const handleToggleVisibility = async (userId: string, currentlyHidden: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ hide_from_listing: !currentlyHidden })
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const handleDeleteUser = async (id: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/agents?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      await fetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user: ' + err.message);
    }
  };

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

      {/* Filters - Sticky */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 5, p: 2, backgroundColor: '#121212', borderBottom: '1px solid #2A2A2A', display: 'flex', gap: 2, flexWrap: 'wrap', flexShrink: 0 }}>
        <TextField
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: '250px', ...dashboardStyles.textField }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon size={20} color="#B0B0B0" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {accountStatusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<UserPlusIcon size={20} />}
          onClick={() => setCreateModalOpen(true)}
          sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
        >
          Create User
        </Button>
      </Box>

      {/* Users Table */}
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
              <TableCell sx={dashboardStyles.table}>Role</TableCell>
              <TableCell sx={dashboardStyles.table}>Account Status</TableCell>
              <TableCell sx={dashboardStyles.table}>Visibility</TableCell>
              <TableCell sx={dashboardStyles.table}>Created</TableCell>
              <TableCell sx={dashboardStyles.table}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={dashboardStyles.table}>
            {filteredUsers.length === 0 ? (
              <TableRow sx={dashboardStyles.table}>
                <TableCell colSpan={7} align="center" sx={{ ...dashboardStyles.table, py: 4 }}>
                  <Typography variant="body1" sx={{ color: '#808080' }}>
                    {searchTerm || statusFilter !== 'all'
                      ? 'No users match your filters'
                      : 'No users yet'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} sx={dashboardStyles.table}>
                  <TableCell sx={dashboardStyles.table}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#FFFFFF' }}>
                      {user.full_name || 'Not set'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>{user.email}</Typography>
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    <Chip
                      label={user.role.toUpperCase()}
                      color={
                        isAdmin(user.role)
                          ? 'error'
                          : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    <Chip
                      label={user.account_status.toUpperCase()}
                      color={getStatusColor(user.account_status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    {(user as any).hide_from_listing ? (
                      <Chip
                        label="Hidden"
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255, 152, 0, 0.1)',
                          color: '#ff9800',
                          border: '1px solid rgba(255, 152, 0, 0.3)'
                        }}
                      />
                    ) : (
                      <Chip
                        label="Visible"
                        size="small"
                        color="success"
                      />
                    )}
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title={(user as any).hide_from_listing ? 'Show on Website' : 'Hide from Website'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleVisibility(user.id, (user as any).hide_from_listing)}
                          sx={{
                            color: (user as any).hide_from_listing ? '#ff9800' : '#81C784',
                            '&:hover': {
                              backgroundColor: (user as any).hide_from_listing ? 'rgba(255, 152, 0, 0.08)' : 'rgba(129, 199, 132, 0.08)',
                            },
                          }}
                        >
                          {(user as any).hide_from_listing ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
                        </IconButton>
                      </Tooltip>
                      {user.account_status === 'approved' && (
                        <Tooltip title="Suspend">
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateAccountStatus(user.id, 'suspended')}
                            sx={{
                              color: '#FFB74D',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 183, 77, 0.08)',
                              },
                            }}
                          >
                            <SuspendIcon size={20} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {user.account_status === 'suspended' && (
                        <Tooltip title="Reactivate">
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateAccountStatus(user.id, 'approved')}
                            sx={{
                              color: '#81C784',
                              '&:hover': {
                                backgroundColor: 'rgba(129, 199, 132, 0.08)',
                              },
                            }}
                          >
                            <ApproveIcon size={20} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Manage Agreements">
                        <IconButton
                          size="small"
                          onClick={() => handleManageAgreements(user)}
                          sx={{
                            color: '#c49d2f',
                            '&:hover': {
                              backgroundColor: 'rgba(196, 157, 47, 0.08)',
                            },
                          }}
                        >
                          <FileTextIcon size={20} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(user)}
                          sx={{
                            color: '#E2C05A',
                            '&:hover': {
                              backgroundColor: 'rgba(226, 192, 90, 0.08)',
                            },
                          }}
                        >
                          <EditIcon size={20} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          sx={{
                            color: '#E57373',
                            '&:hover': {
                              backgroundColor: 'rgba(229, 115, 115, 0.08)',
                            },
                          }}
                        >
                          <DeleteIcon size={20} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modals */}
      <CreateUserModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchUsers}
      />

      <EditUserModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={fetchUsers}
        user={selectedUser}
      />

      {selectedAgentForAgreements && (
        <ManageAgreementsModal
          open={agreementsModalOpen}
          onClose={() => {
            setAgreementsModalOpen(false);
            setSelectedAgentForAgreements(null);
          }}
          agentId={selectedAgentForAgreements.id}
          agentName={selectedAgentForAgreements.name}
        />
      )}
    </Box>
  );
}
