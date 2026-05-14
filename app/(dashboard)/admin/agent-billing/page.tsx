'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Autocomplete,
  InputAdornment,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Plus,
  CreditCard,
  Receipt,
  CheckCircle,
  XCircle,
  WarningCircle,
  CurrencyDollar,
  CalendarBlank,
  ArrowsClockwise,
  Pause,
  Play,
  Trash,
  Clock,
} from '@phosphor-icons/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface Agent {
  id: string;
  full_name: string;
  email: string;
  stripe_customer_id: string | null;
}

interface Charge {
  id: string;
  agent_id: string;
  admin_id: string;
  amount: number;
  description: string;
  stripe_payment_intent_id: string | null;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  receipt_sent: boolean;
  failure_reason: string | null;
  created_at: string;
  agent: { full_name: string; email: string } | null;
  admin: { full_name: string } | null;
}

interface ScheduledCharge {
  id: string;
  agent_id: string;
  admin_id: string;
  amount: number;
  description: string;
  charge_type: 'scheduled' | 'recurring';
  scheduled_date: string | null;
  recurrence_interval: string | null;
  next_charge_date: string | null;
  last_charged_at: string | null;
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  total_charges_made: number;
  created_at: string;
  agent: { full_name: string; email: string } | null;
  admin: { full_name: string } | null;
}

export default function AdminAgentBillingPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'immediate' | 'scheduled' | 'recurring'>('immediate');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [recurrenceInterval, setRecurrenceInterval] = useState('monthly');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cardInfo, setCardInfo] = useState<any>(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Fetch agents
  const { data: agents = [] } = useQuery({
    queryKey: ['billing-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, stripe_customer_id')
        .in('role', ['agent', 'admin'])
        .order('full_name');
      if (error) throw error;
      return data as Agent[];
    },
  });

  // Fetch charge history
  const { data: charges = [], isLoading: chargesLoading } = useQuery({
    queryKey: ['agent-charges'],
    queryFn: async () => {
      const res = await fetch('/api/stripe/admin-charge');
      if (!res.ok) throw new Error('Failed to fetch charges');
      const data = await res.json();
      return (data.charges || []) as Charge[];
    },
  });

  // Fetch scheduled/recurring charges
  const { data: scheduledCharges = [], isLoading: scheduledLoading } = useQuery({
    queryKey: ['scheduled-charges'],
    queryFn: async () => {
      const res = await fetch('/api/stripe/scheduled-charges');
      if (!res.ok) throw new Error('Failed to fetch scheduled charges');
      const data = await res.json();
      return (data.charges || []) as ScheduledCharge[];
    },
  });

  // Immediate charge mutation
  const chargeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAgent || !amount || !description) {
        throw new Error('Please fill in all fields');
      }
      const amountCents = Math.round(parseFloat(amount) * 100);
      if (isNaN(amountCents) || amountCents < 50) {
        throw new Error('Minimum charge is $0.50');
      }
      const res = await fetch('/api/stripe/admin-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgent.id,
          amount: amountCents,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Charge failed');
      return data;
    },
    onSuccess: (data) => {
      setSuccess(`Successfully charged ${data.agent_name} $${(data.amount / 100).toFixed(2)}. Receipt sent to ${data.agent_email}.`);
      setDialogOpen(false);
      setConfirmOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['agent-charges'] });
    },
    onError: (err: any) => {
      setError(err.message);
      setConfirmOpen(false);
    },
  });

  // Scheduled/recurring charge mutation
  const scheduledMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAgent || !amount || !description) {
        throw new Error('Please fill in all fields');
      }
      const amountCents = Math.round(parseFloat(amount) * 100);
      if (isNaN(amountCents) || amountCents < 50) {
        throw new Error('Minimum charge is $0.50');
      }
      const res = await fetch('/api/stripe/scheduled-charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgent.id,
          amount: amountCents,
          description,
          charge_type: dialogMode,
          scheduled_date: dialogMode === 'scheduled' ? scheduledDate : null,
          recurrence_interval: dialogMode === 'recurring' ? recurrenceInterval : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create charge');
      return data;
    },
    onSuccess: (data) => {
      setSuccess(data.message);
      setDialogOpen(false);
      setConfirmOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['scheduled-charges'] });
    },
    onError: (err: any) => {
      setError(err.message);
      setConfirmOpen(false);
    },
  });

  // Pause/resume/cancel mutation
  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const res = await fetch('/api/stripe/scheduled-charges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-charges'] });
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  const resetForm = () => {
    setSelectedAgent(null);
    setAmount('');
    setDescription('');
    setScheduledDate('');
    setRecurrenceInterval('monthly');
    setError(null);
    setCardInfo(null);
  };

  const handleAgentSelect = async (agent: Agent | null) => {
    setSelectedAgent(agent);
    setCardInfo(null);
    setError(null);

    if (!agent?.stripe_customer_id) {
      if (agent) setError('This agent has no card on file. They need to add one in their Billing settings.');
      return;
    }

    setLoadingCard(true);
    try {
      const res = await fetch(`/api/stripe/admin-charge/card?agent_id=${agent.id}`);
      const data = await res.json();
      if (data.card) {
        setCardInfo(data.card);
      } else {
        setError('No card found on file for this agent.');
      }
    } catch {
      setError('Failed to load card info');
    } finally {
      setLoadingCard(false);
    }
  };

  const openDialog = (mode: 'immediate' | 'scheduled' | 'recurring') => {
    resetForm();
    setSuccess(null);
    setDialogMode(mode);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (dialogMode === 'immediate') {
      chargeMutation.mutate();
    } else {
      scheduledMutation.mutate();
    }
  };

  const isPending = chargeMutation.isPending || scheduledMutation.isPending;

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Chip icon={<CheckCircle size={14} weight="fill" />} label="Paid" size="small" sx={{ backgroundColor: 'rgba(76,175,80,0.15)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)' }} />;
      case 'failed':
        return <Chip icon={<XCircle size={14} weight="fill" />} label="Failed" size="small" sx={{ backgroundColor: 'rgba(244,67,54,0.15)', color: '#F44336', border: '1px solid rgba(244,67,54,0.3)' }} />;
      case 'pending':
        return <Chip icon={<WarningCircle size={14} weight="fill" />} label="Pending" size="small" sx={{ backgroundColor: 'rgba(255,152,0,0.15)', color: '#FF9800', border: '1px solid rgba(255,152,0,0.3)' }} />;
      case 'active':
        return <Chip icon={<CheckCircle size={14} weight="fill" />} label="Active" size="small" sx={{ backgroundColor: 'rgba(76,175,80,0.15)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)' }} />;
      case 'paused':
        return <Chip icon={<Pause size={14} weight="fill" />} label="Paused" size="small" sx={{ backgroundColor: 'rgba(255,152,0,0.15)', color: '#FF9800', border: '1px solid rgba(255,152,0,0.3)' }} />;
      case 'cancelled':
        return <Chip icon={<XCircle size={14} weight="fill" />} label="Cancelled" size="small" sx={{ backgroundColor: 'rgba(244,67,54,0.15)', color: '#F44336', border: '1px solid rgba(244,67,54,0.3)' }} />;
      case 'completed':
        return <Chip icon={<CheckCircle size={14} weight="fill" />} label="Completed" size="small" sx={{ backgroundColor: 'rgba(156,39,176,0.15)', color: '#BA68C8', border: '1px solid rgba(156,39,176,0.3)' }} />;
      case 'refunded':
        return <Chip label="Refunded" size="small" sx={{ backgroundColor: 'rgba(156,39,176,0.15)', color: '#BA68C8', border: '1px solid rgba(156,39,176,0.3)' }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const dialogTitle = {
    immediate: 'Charge Agent Now',
    scheduled: 'Schedule a Charge',
    recurring: 'Create Recurring Charge',
  };

  const dialogIcon = {
    immediate: <CurrencyDollar size={24} color="#E2C05A" weight="duotone" />,
    scheduled: <CalendarBlank size={24} color="#E2C05A" weight="duotone" />,
    recurring: <ArrowsClockwise size={24} color="#E2C05A" weight="duotone" />,
  };

  // Get minimum date for scheduling (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Box sx={{ minHeight: '100%', backgroundColor: '#0D0D0D', py: 4 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 1 }}>
              Agent Billing
            </Typography>
            <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
              Charge agents immediately, schedule future charges, or set up recurring billing
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              startIcon={<CurrencyDollar size={20} weight="bold" />}
              onClick={() => openDialog('immediate')}
              sx={{
                backgroundColor: '#E2C05A',
                color: '#0D0D0D',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#C4A43B' },
              }}
            >
              Charge Now
            </Button>
            <Button
              variant="outlined"
              startIcon={<CalendarBlank size={20} />}
              onClick={() => openDialog('scheduled')}
              sx={{
                borderColor: '#E2C05A',
                color: '#E2C05A',
                fontWeight: 600,
                '&:hover': { borderColor: '#C4A43B', backgroundColor: 'rgba(226,192,90,0.08)' },
              }}
            >
              Schedule
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowsClockwise size={20} />}
              onClick={() => openDialog('recurring')}
              sx={{
                borderColor: '#E2C05A',
                color: '#E2C05A',
                fontWeight: 600,
                '&:hover': { borderColor: '#C4A43B', backgroundColor: 'rgba(226,192,90,0.08)' },
              }}
            >
              Recurring
            </Button>
          </Box>
        </Box>

        {/* Success Alert */}
        {success && (
          <Alert
            severity="success"
            onClose={() => setSuccess(null)}
            sx={{ mb: 3, borderRadius: '8px' }}
            icon={<CheckCircle size={20} weight="fill" />}
          >
            {success}
          </Alert>
        )}

        {/* Error Alert */}
        {error && !dialogOpen && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ mb: 3, borderRadius: '8px' }}
          >
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ backgroundColor: '#121212', border: '1px solid #2A2A2A', borderRadius: '12px', overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              borderBottom: '1px solid #2A2A2A',
              '& .MuiTab-root': {
                color: '#808080',
                fontWeight: 500,
                textTransform: 'none',
                '&.Mui-selected': { color: '#E2C05A' },
              },
              '& .MuiTabs-indicator': { backgroundColor: '#E2C05A' },
            }}
          >
            <Tab icon={<Receipt size={18} />} iconPosition="start" label="Charge History" />
            <Tab icon={<CalendarBlank size={18} />} iconPosition="start" label="Scheduled" />
            <Tab icon={<ArrowsClockwise size={18} />} iconPosition="start" label="Recurring" />
          </Tabs>

          {/* Tab 0: Charge History */}
          {activeTab === 0 && (
            <>
              {chargesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#E2C05A' }} />
                </Box>
              ) : charges.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Receipt size={48} weight="duotone" style={{ color: '#555', marginBottom: 12 }} />
                  <Typography variant="body1" sx={{ color: '#808080' }}>No charges yet</Typography>
                  <Typography variant="body2" sx={{ color: '#555', mt: 0.5 }}>Charges will appear here once you bill an agent</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ '& th': { color: '#808080', borderBottom: '1px solid #2A2A2A', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' } }}>
                        <TableCell>Date</TableCell>
                        <TableCell>Agent</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Billed By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {charges.map((charge) => (
                        <TableRow key={charge.id} sx={{ '& td': { color: '#FFFFFF', borderBottom: '1px solid #1A1A1A' }, '&:hover': { backgroundColor: '#1A1A1A' } }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#B0B0B0', fontSize: '0.8rem' }}>{formatDateTime(charge.created_at)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{charge.agent?.full_name || 'Unknown'}</Typography>
                            <Typography variant="caption" sx={{ color: '#808080' }}>{charge.agent?.email}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{charge.description}</Typography>
                            {charge.failure_reason && (
                              <Typography variant="caption" sx={{ color: '#F44336', display: 'block' }}>{charge.failure_reason}</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>${(charge.amount / 100).toFixed(2)}</Typography>
                          </TableCell>
                          <TableCell>{getStatusChip(charge.status)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#B0B0B0', fontSize: '0.8rem' }}>{charge.admin?.full_name || 'Admin'}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {/* Tab 1: Scheduled Charges */}
          {activeTab === 1 && (
            <>
              {scheduledLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#E2C05A' }} />
                </Box>
              ) : scheduledCharges.filter(c => c.charge_type === 'scheduled').length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <CalendarBlank size={48} weight="duotone" style={{ color: '#555', marginBottom: 12 }} />
                  <Typography variant="body1" sx={{ color: '#808080' }}>No scheduled charges</Typography>
                  <Typography variant="body2" sx={{ color: '#555', mt: 0.5 }}>Schedule a one-time future charge for an agent</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ '& th': { color: '#808080', borderBottom: '1px solid #2A2A2A', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' } }}>
                        <TableCell>Scheduled Date</TableCell>
                        <TableCell>Agent</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scheduledCharges
                        .filter(c => c.charge_type === 'scheduled')
                        .map((charge) => (
                        <TableRow key={charge.id} sx={{ '& td': { color: '#FFFFFF', borderBottom: '1px solid #1A1A1A' }, '&:hover': { backgroundColor: '#1A1A1A' } }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {charge.scheduled_date ? formatDate(charge.scheduled_date) : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{charge.agent?.full_name || 'Unknown'}</Typography>
                            <Typography variant="caption" sx={{ color: '#808080' }}>{charge.agent?.email}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{charge.description}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>${(charge.amount / 100).toFixed(2)}</Typography>
                          </TableCell>
                          <TableCell>{getStatusChip(charge.status)}</TableCell>
                          <TableCell>
                            {charge.status === 'active' && (
                              <Tooltip title="Cancel">
                                <IconButton size="small" onClick={() => actionMutation.mutate({ id: charge.id, action: 'cancel' })} sx={{ color: '#EF5350' }}>
                                  <Trash size={18} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {/* Tab 2: Recurring Charges */}
          {activeTab === 2 && (
            <>
              {scheduledLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#E2C05A' }} />
                </Box>
              ) : scheduledCharges.filter(c => c.charge_type === 'recurring').length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <ArrowsClockwise size={48} weight="duotone" style={{ color: '#555', marginBottom: 12 }} />
                  <Typography variant="body1" sx={{ color: '#808080' }}>No recurring charges</Typography>
                  <Typography variant="body2" sx={{ color: '#555', mt: 0.5 }}>Set up automatic recurring charges for agents</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ '& th': { color: '#808080', borderBottom: '1px solid #2A2A2A', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' } }}>
                        <TableCell>Agent</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Frequency</TableCell>
                        <TableCell>Next Charge</TableCell>
                        <TableCell>Total Charged</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scheduledCharges
                        .filter(c => c.charge_type === 'recurring')
                        .map((charge) => (
                        <TableRow key={charge.id} sx={{ '& td': { color: '#FFFFFF', borderBottom: '1px solid #1A1A1A' }, '&:hover': { backgroundColor: '#1A1A1A' } }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{charge.agent?.full_name || 'Unknown'}</Typography>
                            <Typography variant="caption" sx={{ color: '#808080' }}>{charge.agent?.email}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{charge.description}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>${(charge.amount / 100).toFixed(2)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={charge.recurrence_interval ? charge.recurrence_interval.charAt(0).toUpperCase() + charge.recurrence_interval.slice(1) : '—'}
                              size="small"
                              sx={{ backgroundColor: 'rgba(226,192,90,0.15)', color: '#E2C05A', border: '1px solid rgba(226,192,90,0.3)' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                              {charge.next_charge_date ? formatDate(charge.next_charge_date) : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                              {charge.total_charges_made} time{charge.total_charges_made !== 1 ? 's' : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>{getStatusChip(charge.status)}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {charge.status === 'active' && (
                                <>
                                  <Tooltip title="Pause">
                                    <IconButton size="small" onClick={() => actionMutation.mutate({ id: charge.id, action: 'pause' })} sx={{ color: '#FF9800' }}>
                                      <Pause size={18} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Cancel">
                                    <IconButton size="small" onClick={() => actionMutation.mutate({ id: charge.id, action: 'cancel' })} sx={{ color: '#EF5350' }}>
                                      <Trash size={18} />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                              {charge.status === 'paused' && (
                                <>
                                  <Tooltip title="Resume">
                                    <IconButton size="small" onClick={() => actionMutation.mutate({ id: charge.id, action: 'resume' })} sx={{ color: '#4CAF50' }}>
                                      <Play size={18} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Cancel">
                                    <IconButton size="small" onClick={() => actionMutation.mutate({ id: charge.id, action: 'cancel' })} sx={{ color: '#EF5350' }}>
                                      <Trash size={18} />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Paper>

        {/* Charge Dialog (shared for all types) */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#121212',
              border: '1px solid #2A2A2A',
              borderRadius: '12px',
            },
          }}
        >
          <DialogTitle sx={{ color: '#FFFFFF', borderBottom: '1px solid #2A2A2A', pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {dialogIcon[dialogMode]}
              {dialogTitle[dialogMode]}
            </Box>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: '8px' }}>
                {error}
              </Alert>
            )}

            {/* Agent Selection */}
            <Autocomplete
              options={agents}
              getOptionLabel={(option) => `${option.full_name} (${option.email})`}
              value={selectedAgent}
              onChange={(_, value) => handleAgentSelect(value)}
              renderInput={(params) => (
                <TextField {...params} label="Select Agent" fullWidth sx={{ mb: 2, mt: 1 }} />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{option.full_name}</Typography>
                    <Typography variant="caption" sx={{ color: '#808080' }}>
                      {option.email}{!option.stripe_customer_id && ' — No card on file'}
                    </Typography>
                  </Box>
                </Box>
              )}
            />

            {/* Card on File Display */}
            {loadingCard && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 2, backgroundColor: '#1A1A1A', borderRadius: '8px' }}>
                <CircularProgress size={16} sx={{ color: '#E2C05A' }} />
                <Typography variant="body2" sx={{ color: '#B0B0B0' }}>Loading card info...</Typography>
              </Box>
            )}

            {cardInfo && (
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2,
                backgroundColor: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)', borderRadius: '8px',
              }}>
                <CreditCard size={24} color="#4CAF50" weight="duotone" />
                <Box>
                  <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                    {cardInfo.brand?.toUpperCase()} ending in {cardInfo.last4}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#B0B0B0' }}>
                    Expires {cardInfo.exp_month}/{cardInfo.exp_year}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Amount */}
            <TextField
              fullWidth
              label="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              placeholder="0.00"
              sx={{ mb: 2 }}
            />

            {/* Scheduled Date (only for scheduled charges) */}
            {dialogMode === 'scheduled' && (
              <TextField
                fullWidth
                label="Charge Date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: minDate }}
                sx={{ mb: 2 }}
              />
            )}

            {/* Recurrence Interval (only for recurring charges) */}
            {dialogMode === 'recurring' && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={recurrenceInterval}
                  label="Frequency"
                  onChange={(e) => setRecurrenceInterval(e.target.value)}
                >
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="biweekly">Bi-Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Description */}
            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={2}
              placeholder={
                dialogMode === 'immediate'
                  ? 'e.g., Monthly desk fee, Marketing materials, MLS fee...'
                  : dialogMode === 'scheduled'
                  ? 'e.g., Annual technology fee, Conference registration...'
                  : 'e.g., Monthly desk fee, E&O insurance, Technology platform...'
              }
              sx={{ mb: 1 }}
            />

            <Typography variant="caption" sx={{ color: '#808080', display: 'block', mt: 1 }}>
              {dialogMode === 'immediate'
                ? "The agent will receive an email receipt from Stripe and an in-app notification."
                : dialogMode === 'scheduled'
                ? "The charge will be processed on the selected date. The agent will be notified."
                : "The agent will be automatically charged on each interval. You can pause or cancel anytime."}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #2A2A2A' }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ color: '#B0B0B0' }}>Cancel</Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              variant="contained"
              disabled={
                !selectedAgent || !amount || !description || !cardInfo || isPending
                || (dialogMode === 'scheduled' && !scheduledDate)
              }
              sx={{
                backgroundColor: '#E2C05A', color: '#0D0D0D', fontWeight: 600,
                '&:hover': { backgroundColor: '#C4A43B' },
              }}
            >
              {dialogMode === 'immediate' ? 'Review Charge' : 'Review'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmOpen}
          onClose={() => !isPending && setConfirmOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: { backgroundColor: '#121212', border: '1px solid #2A2A2A', borderRadius: '12px' },
          }}
        >
          <DialogTitle sx={{ color: '#FFFFFF', textAlign: 'center', pt: 3 }}>
            {dialogMode === 'immediate' ? 'Confirm Charge' : dialogMode === 'scheduled' ? 'Confirm Scheduled Charge' : 'Confirm Recurring Charge'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h3" sx={{ color: '#E2C05A', fontWeight: 700, mb: 1 }}>
                ${parseFloat(amount || '0').toFixed(2)}
              </Typography>
              {dialogMode === 'recurring' && (
                <Typography variant="body2" sx={{ color: '#FF9800', mb: 0.5 }}>
                  {recurrenceInterval.charAt(0).toUpperCase() + recurrenceInterval.slice(1)}
                </Typography>
              )}
              <Typography variant="body1" sx={{ color: '#FFFFFF', mb: 0.5 }}>
                {selectedAgent?.full_name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 2 }}>
                {cardInfo?.brand?.toUpperCase()} •••• {cardInfo?.last4}
              </Typography>
              {dialogMode === 'scheduled' && scheduledDate && (
                <Typography variant="body2" sx={{ color: '#FF9800', mb: 1 }}>
                  Scheduled for: {formatDate(scheduledDate)}
                </Typography>
              )}
              <Typography variant="body2" sx={{ color: '#808080', fontStyle: 'italic' }}>
                "{description}"
              </Typography>
            </Box>
            <Alert severity="warning" sx={{ mt: 2, borderRadius: '8px' }}>
              {dialogMode === 'immediate'
                ? "This will immediately charge the agent's card. This action cannot be undone."
                : dialogMode === 'scheduled'
                ? "This charge will be processed on the selected date."
                : "This will set up automatic recurring charges. You can pause or cancel anytime."}
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 1, borderTop: '1px solid #2A2A2A' }}>
            <Button onClick={() => setConfirmOpen(false)} disabled={isPending} sx={{ color: '#B0B0B0', minWidth: 100 }}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant="contained"
              disabled={isPending}
              sx={{
                backgroundColor: '#E2C05A', color: '#0D0D0D', fontWeight: 600, minWidth: 140,
                '&:hover': { backgroundColor: '#C4A43B' },
              }}
            >
              {isPending ? (
                <CircularProgress size={20} sx={{ color: '#0D0D0D' }} />
              ) : dialogMode === 'immediate' ? (
                'Charge Now'
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
