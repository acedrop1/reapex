'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Alert,
  CircularProgress,
  Chip,
  MenuItem,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Plus,
  PencilSimple,
  Trash,
  QrCode,
  Copy,
  Eye,
} from '@phosphor-icons/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface YardSign {
  id: string;
  title: string;
  listing_id: string | null;
  agent_id: string | null;
  redirect_url: string | null;
  sign_code: string;
  status: 'active' | 'inactive' | 'removed';
  scan_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Agent {
  id: string;
  full_name: string;
  email: string;
}

interface Listing {
  id: string;
  listing_title: string | null;
  property_address: string | null;
  property_city: string | null;
  slug: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'https://re-apex.com';

function generateSignCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getQrUrl(code: string): string {
  return `${SITE_URL}/sign/${code}`;
}

function getQrImageUrl(code: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getQrUrl(code))}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminYardSignsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSign, setEditingSign] = useState<YardSign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrPreviewCode, setQrPreviewCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    agent_id: '',
    listing_id: '',
    redirect_url: '',
    notes: '',
    sign_code: '',
  });

  // ---------- Data fetching ----------

  const { data: signs = [], isLoading } = useQuery({
    queryKey: ['admin-yard-signs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yard_signs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as YardSign[];
    },
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['admin-yard-signs-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('role', ['agent', 'admin', 'broker'])
        .order('full_name');
      if (error) throw error;
      return data as Agent[];
    },
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['admin-yard-signs-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, listing_title, property_address, property_city, slug')
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Listing[];
    },
  });

  // Lookup maps for display
  const agentMap = useMemo(() => {
    const m = new Map<string, Agent>();
    agents.forEach((a) => m.set(a.id, a));
    return m;
  }, [agents]);

  const listingMap = useMemo(() => {
    const m = new Map<string, Listing>();
    listings.forEach((l) => m.set(l.id, l));
    return m;
  }, [listings]);

  // ---------- Mutations ----------

  const saveMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        title: formData.title,
        agent_id: formData.agent_id || null,
        listing_id: formData.listing_id || null,
        redirect_url: formData.redirect_url || null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
      };

      if (editingSign) {
        const { error: updateError } = await supabase
          .from('yard_signs')
          .update(payload)
          .eq('id', editingSign.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('yard_signs')
          .insert({
            ...payload,
            sign_code: formData.sign_code,
            status: 'active',
            scan_count: 0,
          });
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-yard-signs'] });
      handleCloseDialog();
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to save yard sign');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('yard_signs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-yard-signs'] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase
        .from('yard_signs')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-yard-signs'] });
    },
  });

  // ---------- Dialog helpers ----------

  const handleOpenDialog = (sign?: YardSign) => {
    if (sign) {
      setEditingSign(sign);
      setFormData({
        title: sign.title,
        agent_id: sign.agent_id || '',
        listing_id: sign.listing_id || '',
        redirect_url: sign.redirect_url || '',
        notes: sign.notes || '',
        sign_code: sign.sign_code,
      });
    } else {
      setEditingSign(null);
      setFormData({
        title: '',
        agent_id: '',
        listing_id: '',
        redirect_url: '',
        notes: '',
        sign_code: generateSignCode(),
      });
    }
    setError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSign(null);
    setError(null);
  };

  const handleCopy = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ---------- Render ----------

  const statusColor: Record<string, string> = {
    active: '#4CAF50',
    inactive: '#FF9800',
    removed: '#F44336',
  };

  return (
    <Box sx={{ minHeight: '100%', backgroundColor: '#0a0a0a', py: 4 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 0.5 }}>
              Yard Signs
            </Typography>
            <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
              Manage QR code yard signs for listings and agents
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Plus size={20} weight="bold" />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: '#E2C05A',
              color: '#0a0a0a',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#C4A43B' },
            }}
          >
            Add Sign
          </Button>
        </Box>

        {/* Table */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#E2C05A' }} />
          </Box>
        ) : signs.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 10,
              backgroundColor: '#111',
              borderRadius: '12px',
              border: '1px solid rgba(226,192,90,0.1)',
            }}
          >
            <QrCode size={48} color="#E2C05A" style={{ marginBottom: 12 }} />
            <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 1 }}>
              No Yard Signs Yet
            </Typography>
            <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 3 }}>
              Create your first QR code yard sign to get started.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => handleOpenDialog()}
              sx={{ borderColor: '#E2C05A', color: '#E2C05A' }}
            >
              Create Sign
            </Button>
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: '#111',
              borderRadius: '12px',
              border: '1px solid rgba(226,192,90,0.1)',
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  {['Title', 'Sign Code', 'Agent', 'Listing', 'Status', 'Scans', 'Created', 'Actions'].map(
                    (h) => (
                      <TableCell
                        key={h}
                        sx={{
                          color: '#E2C05A',
                          fontWeight: 600,
                          borderBottomColor: 'rgba(226,192,90,0.15)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {signs.map((sign) => {
                  const agent = sign.agent_id ? agentMap.get(sign.agent_id) : null;
                  const listing = sign.listing_id ? listingMap.get(sign.listing_id) : null;
                  return (
                    <TableRow
                      key={sign.id}
                      sx={{ '&:hover': { backgroundColor: 'rgba(226,192,90,0.04)' } }}
                    >
                      {/* Title */}
                      <TableCell sx={{ color: '#FFFFFF', borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                        {sign.title}
                      </TableCell>

                      {/* Sign Code */}
                      <TableCell sx={{ borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            sx={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: '#E2C05A',
                              fontSize: '0.95rem',
                              letterSpacing: 1,
                            }}
                          >
                            {sign.sign_code}
                          </Typography>
                          <Tooltip title={copiedCode === sign.sign_code ? 'Copied!' : 'Copy URL'}>
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(getQrUrl(sign.sign_code), sign.sign_code)}
                              sx={{ color: '#808080', '&:hover': { color: '#E2C05A' } }}
                            >
                              <Copy size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View QR Code">
                            <IconButton
                              size="small"
                              onClick={() =>
                                setQrPreviewCode(qrPreviewCode === sign.sign_code ? null : sign.sign_code)
                              }
                              sx={{ color: '#808080', '&:hover': { color: '#E2C05A' } }}
                            >
                              <QrCode size={16} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        {qrPreviewCode === sign.sign_code && (
                          <Box sx={{ mt: 1 }}>
                            <img
                              src={getQrImageUrl(sign.sign_code)}
                              alt={`QR code for ${sign.sign_code}`}
                              width={140}
                              height={140}
                              style={{ borderRadius: 8, backgroundColor: '#fff', padding: 4 }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ display: 'block', color: '#808080', mt: 0.5, wordBreak: 'break-all' }}
                            >
                              {getQrUrl(sign.sign_code)}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>

                      {/* Agent */}
                      <TableCell sx={{ color: '#B0B0B0', borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                        {agent ? agent.full_name : <span style={{ color: '#555' }}>--</span>}
                      </TableCell>

                      {/* Listing */}
                      <TableCell
                        sx={{
                          color: '#B0B0B0',
                          borderBottomColor: 'rgba(255,255,255,0.05)',
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {listing
                          ? listing.listing_title || listing.property_address || '--'
                          : sign.redirect_url
                          ? (
                            <Tooltip title={sign.redirect_url}>
                              <span style={{ color: '#E2C05A', fontSize: '0.85rem' }}>
                                Custom URL
                              </span>
                            </Tooltip>
                          )
                          : <span style={{ color: '#555' }}>--</span>}
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                        <Switch
                          checked={sign.status === 'active'}
                          onChange={() =>
                            toggleStatusMutation.mutate({
                              id: sign.id,
                              newStatus: sign.status === 'active' ? 'inactive' : 'active',
                            })
                          }
                          size="small"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#4CAF50' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#4CAF50',
                            },
                          }}
                        />
                        <Chip
                          label={sign.status}
                          size="small"
                          sx={{
                            ml: 0.5,
                            backgroundColor: `${statusColor[sign.status]}20`,
                            color: statusColor[sign.status],
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 22,
                          }}
                        />
                      </TableCell>

                      {/* Scans */}
                      <TableCell
                        sx={{
                          color: '#FFFFFF',
                          fontWeight: 600,
                          borderBottomColor: 'rgba(255,255,255,0.05)',
                        }}
                      >
                        {sign.scan_count}
                      </TableCell>

                      {/* Created */}
                      <TableCell sx={{ color: '#808080', borderBottomColor: 'rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}>
                        {formatDate(sign.created_at)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Preview redirect">
                            <IconButton
                              size="small"
                              onClick={() => window.open(getQrUrl(sign.sign_code), '_blank')}
                              sx={{ color: '#808080', '&:hover': { color: '#E2C05A' } }}
                            >
                              <Eye size={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(sign)}
                              sx={{ color: '#808080', '&:hover': { color: '#E2C05A' } }}
                            >
                              <PencilSimple size={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (confirm('Delete this yard sign? This cannot be undone.')) {
                                  deleteMutation.mutate(sign.id);
                                }
                              }}
                              sx={{ color: '#808080', '&:hover': { color: '#F44336' } }}
                            >
                              <Trash size={18} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Add / Edit Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#111',
              border: '1px solid rgba(226,192,90,0.15)',
              borderRadius: '12px',
            },
          }}
        >
          <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 600 }}>
            {editingSign ? 'Edit Yard Sign' : 'Create Yard Sign'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Title"
              placeholder='e.g. "123 Main St Open House Sign"'
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              sx={{ mt: 2, mb: 2 }}
              InputLabelProps={{ sx: { color: '#808080' } }}
              InputProps={{ sx: { color: '#FFFFFF' } }}
            />

            {/* Sign Code (read-only for new, hidden for edit) */}
            {!editingSign && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: '#808080', mb: 0.5, display: 'block' }}>
                  Auto-generated Sign Code
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    backgroundColor: '#1a1a1a',
                    borderRadius: '8px',
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: '#E2C05A',
                      fontSize: '1.1rem',
                      letterSpacing: 2,
                      flex: 1,
                    }}
                  >
                    {formData.sign_code}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setFormData({ ...formData, sign_code: generateSignCode() })}
                    sx={{ color: '#808080', minWidth: 'auto', fontSize: '0.75rem' }}
                  >
                    Regenerate
                  </Button>
                </Box>
                <Typography variant="caption" sx={{ color: '#555', mt: 0.5, display: 'block' }}>
                  URL: {getQrUrl(formData.sign_code)}
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              select
              label="Agent (optional)"
              value={formData.agent_id}
              onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
              sx={{ mb: 2 }}
              InputLabelProps={{ sx: { color: '#808080' } }}
              InputProps={{ sx: { color: '#FFFFFF' } }}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {agents.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.full_name} ({a.email})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              select
              label="Listing (optional)"
              value={formData.listing_id}
              onChange={(e) => setFormData({ ...formData, listing_id: e.target.value })}
              sx={{ mb: 2 }}
              InputLabelProps={{ sx: { color: '#808080' } }}
              InputProps={{ sx: { color: '#FFFFFF' } }}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {listings.map((l) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.listing_title || l.property_address || 'Untitled'}{' '}
                  {l.property_city ? `- ${l.property_city}` : ''}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Custom Redirect URL (optional)"
              placeholder="https://example.com/promo"
              value={formData.redirect_url}
              onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
              helperText="Used if no listing is selected. Overrides agent page redirect."
              sx={{ mb: 2 }}
              InputLabelProps={{ sx: { color: '#808080' } }}
              InputProps={{ sx: { color: '#FFFFFF' } }}
              FormHelperTextProps={{ sx: { color: '#555' } }}
            />

            <TextField
              fullWidth
              label="Notes (optional)"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal notes about this sign..."
              InputLabelProps={{ sx: { color: '#808080' } }}
              InputProps={{ sx: { color: '#FFFFFF' } }}
            />

            {/* QR Preview for new signs */}
            {!editingSign && formData.sign_code && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#808080', mb: 1, display: 'block' }}>
                  QR Code Preview
                </Typography>
                <img
                  src={getQrImageUrl(formData.sign_code)}
                  alt="QR Code preview"
                  width={160}
                  height={160}
                  style={{ borderRadius: 8, backgroundColor: '#fff', padding: 6 }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={handleCloseDialog} sx={{ color: '#B0B0B0' }}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              variant="contained"
              disabled={saveMutation.isPending || !formData.title}
              sx={{
                backgroundColor: '#E2C05A',
                color: '#0a0a0a',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#C4A43B' },
              }}
            >
              {saveMutation.isPending ? (
                <CircularProgress size={20} sx={{ color: '#0a0a0a' }} />
              ) : editingSign ? (
                'Update'
              ) : (
                'Create'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
