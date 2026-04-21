'use client';

import { useState, useEffect } from 'react';
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
  Grid,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  PencilSimple as EditIcon,
  Trash as DeleteIcon,
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  TiktokLogo,
  XLogo,
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { isAdmin } from '@/lib/utils/auth';

interface Agent {
  id: string;
  email: string;
  full_name: string | null;
  title: string | null;
  role: string;
  phone: string | null;
  license_number: string | null;
  headshot_url: string | null;
  bio: string | null;
  specialties: string[] | null;
  languages: string[] | null;
  years_experience: number | null;
  is_active: boolean;
  hide_from_listing: boolean;
  display_order: number;
  cap_amount: number;
  current_cap_progress: number;
  created_at: string;
}

const roleOptions = [
  { value: 'agent', label: 'Agent' },
  { value: 'admin', label: 'Admin' },
];

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Form state
  const [formData, setFormData] = useState<any>({});

  const supabase = createClient();

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (err: any) {
      setError('Failed to load agents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({
      full_name: agent.full_name || '',
      title: agent.title || 'LICENSED REALTOR',
      email: agent.email,
      role: agent.role,
      phone: agent.phone || '',
      license_number: agent.license_number || '',
      headshot_url: agent.headshot_url || '',
      bio: agent.bio || '',
      specialties: agent.specialties?.join(', ') || '',
      languages: agent.languages?.join(', ') || '',
      years_experience: agent.years_experience || '',
      is_active: agent.is_active,
      hide_from_listing: agent.hide_from_listing || false,
      display_order: agent.display_order || 0,
      cap_amount: agent.cap_amount || 0,
      current_cap_progress: agent.current_cap_progress || 0,
      social_facebook: (agent as any).social_facebook || '',
      social_instagram: (agent as any).social_instagram || '',
      social_linkedin: (agent as any).social_linkedin || '',
      social_tiktok: (agent as any).social_tiktok || '',
      social_x: (agent as any).social_x || '',
    });
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setSelectedAgent(null);
    setFormData({});
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;

    setUpdating(true);
    try {
      // Convert string arrays
      const updates: any = { ...formData };
      if (updates.specialties) {
        updates.specialties = updates.specialties.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (updates.languages) {
        updates.languages = updates.languages.split(',').map((l: string) => l.trim()).filter(Boolean);
      }
      if (updates.years_experience) {
        updates.years_experience = parseInt(updates.years_experience);
      }
      if (updates.display_order) {
        updates.display_order = parseInt(updates.display_order);
      }
      if (updates.current_cap_progress) {
        updates.current_cap_progress = parseFloat(updates.current_cap_progress);
      }

      // Remove empty strings
      Object.keys(updates).forEach(key => {
        if (updates[key] === '') updates[key] = null;
      });

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', selectedAgent.id);

      if (error) throw error;

      await fetchAgents();
      handleCloseEdit();
    } catch (err: any) {
      console.error('Error updating agent:', err);
      alert('Failed to update agent: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent? This will also delete all their listings and transactions.')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchAgents();
    } catch (err: any) {
      console.error('Error deleting agent:', err);
      alert('Failed to delete agent: ' + err.message);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          All Agents
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all agent profiles
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid #2A2A2A' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(226, 192, 90, 0.08)' }}>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>License</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Visibility</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4, borderBottom: '1px solid #2A2A2A' }}>
                  <Typography variant="body1" sx={{ color: '#808080' }}>
                    No agents yet
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              agents.map((agent) => (
                <TableRow
                  key={agent.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(226, 192, 90, 0.04)',
                    },
                  }}
                >
                  <TableCell sx={{ borderBottom: '1px solid #2A2A2A' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#FFFFFF' }}>
                      {agent.full_name || 'Not set'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #2A2A2A', color: '#FFFFFF' }}>{agent.email}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #2A2A2A' }}>
                    <Chip
                      label={agent.role}
                      color={isAdmin(agent.role) ? 'error' : 'default'}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #2A2A2A', color: '#FFFFFF' }}>{agent.phone || '-'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #2A2A2A', color: '#FFFFFF' }}>{agent.license_number || '-'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #2A2A2A' }}>
                    <Chip
                      label={agent.is_active ? 'Active' : 'Inactive'}
                      color={agent.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #2A2A2A' }}>
                    {agent.hide_from_listing ? (
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
                  <TableCell sx={{ borderBottom: '1px solid #2A2A2A', color: '#FFFFFF' }}>{format(new Date(agent.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #2A2A2A' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(agent)}
                        sx={{
                          color: '#E2C05A',
                          '&:hover': {
                            backgroundColor: 'rgba(226, 192, 90, 0.08)',
                          },
                        }}
                      >
                        <EditIcon size={20} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteAgent(agent.id)}
                        sx={{
                          color: '#E57373',
                          '&:hover': {
                            backgroundColor: 'rgba(229, 115, 115, 0.08)',
                          },
                        }}
                      >
                        <DeleteIcon size={20} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Modal */}
      <Dialog open={editOpen} onClose={handleCloseEdit} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Edit Agent
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {selectedAgent && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Professional Title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., LICENSED REALTOR, BROKER ASSOCIATE"
                  helperText="This appears on the agent's public profile (Admin only)"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role || ''}
                    label="Role"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {roleOptions.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="License Number"
                  value={formData.license_number || ''}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Years Experience"
                  type="number"
                  value={formData.years_experience || ''}
                  onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Headshot URL"
                  value={formData.headshot_url || ''}
                  onChange={(e) => setFormData({ ...formData, headshot_url: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Bio"
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Specialties (comma separated)"
                  value={formData.specialties || ''}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  placeholder="e.g., Residential, Commercial"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Languages (comma separated)"
                  value={formData.languages || ''}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                  placeholder="e.g., English, Spanish"
                />
              </Grid>

              {/* Social Media Fields */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Social Media
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Facebook"
                  value={formData.social_facebook || ''}
                  onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
                  placeholder="https://facebook.com/username"
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                        <FacebookLogo size={20} />
                      </Box>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Instagram"
                  value={formData.social_instagram || ''}
                  onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                  placeholder="https://instagram.com/username"
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                        <InstagramLogo size={20} />
                      </Box>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="LinkedIn"
                  value={formData.social_linkedin || ''}
                  onChange={(e) => setFormData({ ...formData, social_linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                        <LinkedinLogo size={20} />
                      </Box>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="TikTok"
                  value={formData.social_tiktok || ''}
                  onChange={(e) => setFormData({ ...formData, social_tiktok: e.target.value })}
                  placeholder="https://tiktok.com/@username"
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                        <TiktokLogo size={20} />
                      </Box>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="X (Twitter)"
                  value={formData.social_x || ''}
                  onChange={(e) => setFormData({ ...formData, social_x: e.target.value })}
                  placeholder="https://x.com/username"
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                        <XLogo size={20} />
                      </Box>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Current Cap Progress"
                  type="number"
                  value={formData.current_cap_progress || ''}
                  onChange={(e) => setFormData({ ...formData, current_cap_progress: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Display Order"
                  type="number"
                  value={formData.display_order || ''}
                  onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active || false}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.hide_from_listing || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        hide_from_listing: e.target.checked
                      })}
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
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', px: 3, py: 2 }}>
          <Button onClick={handleCloseEdit} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateAgent}
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
            {updating ? 'Updating...' : 'Update Agent'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
