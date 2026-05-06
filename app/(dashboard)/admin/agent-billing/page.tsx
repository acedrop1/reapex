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
} from '@mui/material';
import {
  Plus,
  CreditCard,
  Receipt,
  CheckCircle,
  XCircle,
  WarningCircle,
  CurrencyDollar,
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

export default function AdminAgentBillingPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
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
        .in('role', ['agent', 'admin', 'broker'])
        .order('full_name');
      if (error) throw error;
      return data as Agent[];
    },
  });

  // Fetch charge history
  const { data: charges = [], isLoading } = useQuery({
    queryKey: ['agent-charges'],
    queryFn: async () => {
      const res = await fetch('/api/stripe/admin-charge');
      if (!res.ok) throw new Error('Failed to fetch charges');
      const data = await res.json();
      return (data.charges || []) as Charge[];
    },
  });

  // Charge mutation
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

  const resetForm = () => {
    setSelectedAgent(null);
    setAmount('');
    setDescription('');
    setError(null);
    setCardInfo(null);
  };

  // When agent is selected, fetch their card info
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
      // Admin fetches agent's payment methods via Stripe directly from API
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

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Chip icon={<CheckCircle size={14} weight="fill" />} label="Paid" size="small" sx={{ backgroundColor: 'rgba(76,175,80,0.15)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)' }} />;
      case 'failed':
        return <Chip icon={<XCircle size={14} weight="fill" />} label="Failed" size="small" sx={{ backgroundColor: 'rgba(244,67,54,0.15)', color: '#F44336', border: '1px solid rgba(244,67,54,0.3)' }} />;
      case 'pending':
        return <Chip icon={<WarningCircle size={14} weight="fill" />} label="Pending" size="small" sx={{ backgroundColor: 'rgba(255,152,0,0.15)', color: '#FF9800', border: '1px solid rgba(255,152,0,0.3)' }} />;
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
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ minHeight: '100%', backgroundColor: '#0D0D0D', py: 4 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 1 }}>
              Agent Billing
            </Typography>
            <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
              Charge agents directly using their card on file
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<CurrencyDollar size={20} weight="bold" />}
            onClick={() => {
              resetForm();
              setSuccess(null);
              setDialogOpen(true);
            }}
            sx={{
              backgroundColor: '#E2C05A',
              color: '#0D0D0D',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#C4A43B' },
            }}
          >
            Charge Agent
          </Button>
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

        {/* Charge History */}
        <Paper sx={{ backgroundColor: '#121212', border: '1px solid #2A2A2A', borderRadius: '12px', overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #2A2A2A' }}>
            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: '1rem' }}>
              Charge History
            </Typography>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#E2C05A' }} />
            </Box>
          ) : charges.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Receipt size={48} weight="duotone" style={{ color: '#555', marginBottom: 12 }} />
              <Typography variant="body1" sx={{ color: '#808080' }}>
                No charges yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#555', mt: 0.5 }}>
                Charges will appear here once you bill an agent
              </Typography>
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
                    <TableRow
                      key={charge.id}
                      sx={{
                        '& td': { color: '#FFFFFF', borderBottom: '1px solid #1A1A1A' },
                        '&:hover': { backgroundColor: '#1A1A1A' },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#B0B0B0', fontSize: '0.8rem' }}>
                          {formatDate(charge.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {charge.agent?.full_name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#808080' }}>
                          {charge.agent?.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {charge.description}
                        </Typography>
                        {charge.failure_reason && (
                          <Typography variant="caption" sx={{ color: '#F44336', display: 'block' }}>
                            {charge.failure_reason}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                          ${(charge.amount / 100).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(charge.status)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#B0B0B0', fontSize: '0.8rem' }}>
                          {charge.admin?.full_name || 'Admin'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Charge Dialog */}
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
              <CurrencyDollar size={24} color="#E2C05A" weight="duotone" />
              Charge Agent
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
                <TextField
                  {...params}
                  label="Select Agent"
                  fullWidth
                  sx={{ mb: 2, mt: 1 }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.full_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#808080' }}>
                      {option.email}
                      {!option.stripe_customer_id && ' — No card on file'}
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
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                p: 2,
                backgroundColor: 'rgba(76,175,80,0.08)',
                border: '1px solid rgba(76,175,80,0.2)',
                borderRadius: '8px',
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
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                setAmount(val);
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              placeholder="0.00"
              sx={{ mb: 2 }}
            />

            {/* Description */}
            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={2}
              placeholder="e.g., Monthly desk fee, Marketing materials, MLS fee..."
              sx={{ mb: 1 }}
            />

            <Typography variant="caption" sx={{ color: '#808080', display: 'block', mt: 1 }}>
              The agent will receive an email receipt from Stripe and an in-app notification.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #2A2A2A' }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ color: '#B0B0B0' }}>
              Cancel
            </Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              variant="contained"
              disabled={!selectedAgent || !amount || !description || !cardInfo || chargeMutation.isPending}
              sx={{
                backgroundColor: '#E2C05A',
                color: '#0D0D0D',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#C4A43B' },
              }}
            >
              Review Charge
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmOpen}
          onClose={() => !chargeMutation.isPending && setConfirmOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#121212',
              border: '1px solid #2A2A2A',
              borderRadius: '12px',
            },
          }}
        >
          <DialogTitle sx={{ color: '#FFFFFF', textAlign: 'center', pt: 3 }}>
            Confirm Charge
          </DialogTitle>
          <DialogContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h3" sx={{ color: '#E2C05A', fontWeight: 700, mb: 1 }}>
                ${parseFloat(amount || '0').toFixed(2)}
              </Typography>
              <Typography variant="body1" sx={{ color: '#FFFFFF', mb: 0.5 }}>
                {selectedAgent?.full_name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 2 }}>
                {cardInfo?.brand?.toUpperCase()} •••• {cardInfo?.last4}
              </Typography>
              <Typography variant="body2" sx={{ color: '#808080', fontStyle: 'italic' }}>
                "{description}"
              </Typography>
            </Box>
            <Alert severity="warning" sx={{ mt: 2, borderRadius: '8px' }}>
              This will immediately charge the agent's card. This action cannot be undone.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 1, borderTop: '1px solid #2A2A2A' }}>
            <Button
              onClick={() => setConfirmOpen(false)}
              disabled={chargeMutation.isPending}
              sx={{ color: '#B0B0B0', minWidth: 100 }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => chargeMutation.mutate()}
              variant="contained"
              disabled={chargeMutation.isPending}
              sx={{
                backgroundColor: '#E2C05A',
                color: '#0D0D0D',
                fontWeight: 600,
                minWidth: 140,
                '&:hover': { backgroundColor: '#C4A43B' },
              }}
            >
              {chargeMutation.isPending ? (
                <CircularProgress size={20} sx={{ color: '#0D0D0D' }} />
              ) : (
                'Charge Now'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
