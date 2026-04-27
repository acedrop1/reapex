'use client';

import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { generatePayoutPDF } from '@/lib/pdf-generator';
import { createClient } from '@/lib/supabase/client';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Card,
  Grid,
  Divider,
  Autocomplete,
  Menu, // Added for dropdown menu
  ListItemIcon, // Added for menu icons
  ListItemText, // Added for menu text
} from '@mui/material';
import {
  CheckCircle,
  Visibility,
  AttachMoney,
  Add,
  Delete,
  Edit,
  MoreVert, // Added for menu icon
  Description, // Added for PDF icon
} from '@mui/icons-material';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';

export interface Fee {
  name: string;
  amount: number;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
}

export interface Transaction {
  id: string;
  agent_id: string;
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string | null;
  transaction_type: string;
  agency_type: string;
  gci: number;
  agent_split_percentage: number;
  agent_commission: number;
  status: string;
  commission_status: string;
  final_commission_amount: number | null;
  brokerage_split_percentage: number | null;
  brokerage_fees: Fee[];
  agent_net_payout: number | null;
  closing_date: string | null;
  approved_by: string | null;
  approved_at: string | null;
  payout_notes: string | null;
  pdf_url: string | null;
  created_at: string;
  users: User;
}

const FEE_CATEGORIES = [
  'NJMLS FEE',
  'HCMLS FEE',
  'GSMLS FEE',
  'MLS FEE',
  'SALE TRANSACTION FEE',
  'LEASE PROCESSING FEE',
  'SERVICE FEE',
  'LEASE PROCESSING FEE',
  'SERVICE FEE',
];

export default function CommissionPayoutsPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [createDialog, setCreateDialog] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    agent_id: '',
    property_address: '',
    property_city: '',
    property_state: '',
    gci: '',
    commission_status: 'pending_approval', // Default
  });

  const [approvalForm, setApprovalForm] = useState({
    final_commission_amount: '',
    brokerage_split_percentage: '80',
    brokerage_fees: [] as Fee[],
    payout_notes: '',
  });

  const [feeForm, setFeeForm] = useState({
    category: '',
    customName: '',
    amount: ''
  });

  // Filter state
  const [filterStatus, setFilterStatus] = useState('pending_approval'); // all, pending_approval, approved, paid
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchTransactions();
    fetchAgents();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          users:agent_id (
            id,
            full_name,
            email
          )
        `)
        .eq('status', 'closed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      // Assuming 'users' table or view exists and is accessible
      // Adjust table name if necessary (e.g., 'profiles') based on your schema
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  // --- Create Functions ---

  const handleOpenCreateDialog = () => {
    setCreateForm({
      agent_id: '',
      property_address: '',
      property_city: '',
      property_state: 'NJ', // Default
      gci: '',
      commission_status: 'pending_approval',
    });
    setCreateDialog(true);
  };

  const handleCreatePayout = async () => {
    try {
      if (!createForm.agent_id || !createForm.property_address || !createForm.gci) {
        alert('Please fill in all required fields');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const gci = parseFloat(createForm.gci);

      const { error } = await supabase
        .from('transactions')
        .insert({
          agent_id: createForm.agent_id,
          property_address: createForm.property_address,
          property_city: createForm.property_city,
          property_state: createForm.property_state,
          property_zip: '', // Default to empty string if required
          transaction_type: 'sale', // Default
          agency_type: 'seller', // Default
          gci: gci,
          final_commission_amount: gci, // Initialize with GCI
          status: 'closed', // Default to closed for commission payouts
          commission_status: createForm.commission_status, // Use selected commission status
          agent_split_percentage: 80, // Default, editable later
          agent_commission: gci * 0.8, // Estimate
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      await fetchTransactions();
      setCreateDialog(false);
    } catch (error: any) {
      console.error('Error creating payout:', error);
      alert(`Error creating payout: ${error.message || 'Unknown error'}`);
    }
  };

  // --- Approval/Edit Functions ---

  const handleOpenApprovalDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setApprovalForm({
      final_commission_amount: transaction.final_commission_amount?.toString() || transaction.gci?.toString() || '',
      brokerage_split_percentage: transaction.brokerage_split_percentage?.toString() || '80',
      brokerage_fees: transaction.brokerage_fees || [],
      payout_notes: transaction.payout_notes || '',
    });
    setFeeForm({ category: '', customName: '', amount: '' });
    setApprovalDialog(true);
  };

  const handleCloseApprovalDialog = () => {
    setApprovalDialog(false);
    setFeeForm({ category: '', customName: '', amount: '' });
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setViewDialog(true);
  };

  const handleAddFee = () => {
    if (feeForm.category && feeForm.amount) {
      setApprovalForm({
        ...approvalForm,
        brokerage_fees: [
          ...approvalForm.brokerage_fees,
          {
            name: feeForm.category,
            amount: parseFloat(feeForm.amount),
          },
        ],
      });
      setFeeForm({ category: '', customName: '', amount: '' });
    }
  };

  const handleRemoveFee = (index: number) => {
    const newFees = approvalForm.brokerage_fees.filter((_, i) => i !== index);
    setApprovalForm({ ...approvalForm, brokerage_fees: newFees });
  };

  const calculateTotalFees = () => {
    return approvalForm.brokerage_fees.reduce((sum, fee) => sum + fee.amount, 0);
  };

  const calculateNetPayout = () => {
    // Uses the Editable Gross Commission
    const grossCommission = parseFloat(approvalForm.final_commission_amount) || 0;
    const splitPercentage = parseFloat(approvalForm.brokerage_split_percentage) || 0;
    const totalFees = calculateTotalFees();

    const agentGross = grossCommission * (splitPercentage / 100);
    return agentGross - totalFees;
  };

  const handleApproveCommission = async () => {
    if (!selectedTransaction) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const netPayout = calculateNetPayout();

      const { error } = await supabase
        .from('transactions')
        .update({
          commission_status: 'approved',
          final_commission_amount: parseFloat(approvalForm.final_commission_amount) || 0, // This is the Gross Commission
          brokerage_split_percentage: parseFloat(approvalForm.brokerage_split_percentage),
          brokerage_fees: approvalForm.brokerage_fees,
          agent_net_payout: netPayout,
          payout_notes: approvalForm.payout_notes,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', selectedTransaction.id);

      if (error) throw error;

      await fetchTransactions();
      handleCloseApprovalDialog();
    } catch (error) {
      console.error('Error approving commission:', error);
      alert('Error approving commission');
    }
  };

  const handleMarkAsPaid = async (transactionId: string) => {
    if (!confirm('Mark this commission as paid? This confirms the physical check has been issued.')) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ commission_status: 'paid' })
        .eq('id', transactionId);

      if (error) throw error;

      await fetchTransactions();
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Error marking as paid');
    }
  };

  const handleGenerateStatement = async (transaction: Transaction) => {
    try {
      // 1. If PDF exists, open it
      if (transaction.pdf_url) {
        window.open(transaction.pdf_url, '_blank');
        return;
      }

      // 2. Generate PDF
      setLoading(true);
      const pdfBlob = await generatePayoutPDF(transaction);

      // 3. Upload to Supabase Storage
      const fileName = `payouts/${transaction.id}_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 4. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // 5. Update Transaction Record
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ pdf_url: publicUrl })
        .eq('id', transaction.id);

      if (updateError) throw updateError;

      // 6. Update Local State
      setTransactions(prev => prev.map(t =>
        t.id === transaction.id
          ? { ...t, pdf_url: publicUrl }
          : t
      ));

      // 7. Open PDF
      window.open(publicUrl, '_blank');

    } catch (error) {
      console.error('Error generating statement:', error);
      alert('Failed to generate statement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    // Status Filter
    if (filterStatus !== 'all' && transaction.commission_status !== filterStatus) {
      return false;
    }

    // Date Filter
    if (dateFilter.startDate) {
      const txDate = new Date(transaction.created_at);
      const startDate = new Date(dateFilter.startDate);
      if (txDate < startDate) return false;
    }

    if (dateFilter.endDate) {
      const txDate = new Date(transaction.created_at);
      // Set end date to end of day
      const endDate = new Date(dateFilter.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (txDate > endDate) return false;
    }

    return true;
  });

  const getCommissionStatusChip = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <Chip label="Pending Approval" size="small" sx={dashboardStyles.chipWarning} />;
      case 'approved':
        return <Chip label="Approved" size="small" sx={dashboardStyles.chipSuccess} />;
      case 'paid':
        return <Chip label="Paid" size="small" sx={dashboardStyles.chipInfo} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ padding: '32px' }}>
        <Typography sx={{ color: '#FFFFFF' }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0D0D0D' }}>
      {/* Filter Bar - Sticky */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 5, p: 2, backgroundColor: '#121212', borderBottom: '1px solid #2A2A2A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Start Date"
            type="date"
            value={dateFilter.startDate}
            onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
            sx={dashboardStyles.textField}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            value={dateFilter.endDate}
            onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
            sx={dashboardStyles.textField}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: '#B0B0B0' }}>Filter by Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Filter by Status"
              sx={{
                color: '#FFFFFF',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#2A2A2A',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#333333',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E2C05A',
                },
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending_approval">Pending Approval</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
            </Select>
          </FormControl>
          {(dateFilter.startDate || dateFilter.endDate) && (
            <Button
              onClick={() => setDateFilter({ startDate: '', endDate: '' })}
              sx={{ color: '#B0B0B0', textTransform: 'none' }}
            >
              Clear Dates
            </Button>
          )}
        </Box>

        <Button
          variant="contained"
          onClick={handleOpenCreateDialog}
          startIcon={<Add />}
          sx={{
            ...dashboardStyles.buttonContained,
            backgroundColor: '#E2C05A',
            '&:hover': {
              backgroundColor: '#C4A43B',
            },
          }}
        >
          Add Commission Payout
        </Button>
      </Box>

      {/* Transactions Table */}
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
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Agent</TableCell>
              <TableCell>Property</TableCell>
              <TableCell>Gross Comm.</TableCell>
              <TableCell>Net Payout</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Closing Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Typography sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                    {transaction.users?.full_name || 'Unknown'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#808080' }}>
                    {transaction.users?.email || ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ color: '#FFFFFF' }}>
                    {transaction.property_address}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#808080' }}>
                    {transaction.property_city}, {transaction.property_state}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ color: '#E2C05A', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                    ${(transaction.final_commission_amount || transaction.gci || 0).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  {transaction.agent_net_payout !== null ? (
                    <Typography sx={{ color: '#E2C05A', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                      ${transaction.agent_net_payout.toLocaleString()}
                    </Typography>
                  ) : (
                    <Typography sx={{ color: '#808080' }}>
                      Not calculated
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {getCommissionStatusChip(transaction.commission_status)}
                </TableCell>
                <TableCell>
                  <Typography sx={{ color: '#B0B0B0', fontSize: '14px' }}>
                    {transaction.closing_date
                      ? new Date(transaction.closing_date).toLocaleDateString()
                      : 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={transaction.commission_status === 'pending_approval' ? "Edit Details" : "View Details"}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (transaction.commission_status === 'pending_approval') {
                            handleOpenApprovalDialog(transaction);
                          } else {
                            handleViewTransaction(transaction);
                          }
                        }}
                        sx={{ color: '#E2C05A' }}
                      >
                        {transaction.commission_status === 'pending_approval' ? <Edit fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={transaction.pdf_url ? "View Statement" : "Generate Statement"}>
                      <IconButton
                        size="small"
                        onClick={() => handleGenerateStatement(transaction)}
                        sx={{ color: transaction.pdf_url ? '#4CAF50' : '#FF9800' }}
                      >
                        <Description fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {transaction.commission_status === 'approved' && (
                      <Tooltip title="Mark as Paid">
                        <IconButton
                          size="small"
                          onClick={() => handleMarkAsPaid(transaction.id)}
                          sx={{ color: '#4CAF50' }}
                        >
                          <AttachMoney fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filteredTransactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography sx={{ color: '#808080' }}>
                    No transactions found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table >
      </TableContainer >

      {/* View Transaction Dialog (Read-only) implementation kept simple for brevity or reuse existing */}
      {/* Note: I'm reusing the ViewDialog from previous implementation but adapting if needed. 
          Actually, let's keep the existing ViewDialog but I need to make sure `handleViewTransaction` is defined 
          since I conditionally used it above. 
       */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#121212',
            border: '1px solid #2A2A2A',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 700 }}>
          Payout Details
        </DialogTitle>
        <DialogContent>
          {/* Reuse existing view content here, simplified for this replace block */}
          {/* To be safe, I'm including the full ViewDialog content from the original file to avoid breaking it */}
          {selectedTransaction && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <Box>
                <Typography sx={{ color: '#B0B0B0', fontSize: '12px', mb: 0.5 }}>
                  Agent
                </Typography>
                <Typography sx={{ color: '#FFFFFF', fontSize: '16px' }}>
                  {selectedTransaction.users?.full_name || 'Unknown'}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#B0B0B0', fontSize: '12px', mb: 0.5 }}>
                  Property
                </Typography>
                <Typography sx={{ color: '#FFFFFF', fontSize: '16px' }}>
                  {selectedTransaction.property_address}
                </Typography>
                <Typography sx={{ color: '#808080', fontSize: '14px' }}>
                  {selectedTransaction.property_city}, {selectedTransaction.property_state}
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography sx={{ color: '#B0B0B0', fontSize: '12px', mb: 0.5 }}>
                    Gross Commission
                  </Typography>
                  <Typography sx={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                    ${(selectedTransaction.final_commission_amount || selectedTransaction.gci || 0).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
              {selectedTransaction.brokerage_fees && selectedTransaction.brokerage_fees.length > 0 && (
                <Box>
                  <Typography sx={{ color: '#B0B0B0', fontSize: '12px', mb: 1 }}>
                    Fees
                  </Typography>
                  {selectedTransaction.brokerage_fees.map((fee: Fee, index: number) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography sx={{ color: '#FFFFFF' }}>{fee.name}</Typography>
                      <Typography sx={{ color: '#F44336', fontFamily: '"JetBrains Mono", monospace' }}>
                        -${fee.amount.toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
              <Box>
                <Typography sx={{ color: '#B0B0B0', fontSize: '12px', mb: 0.5 }}>
                  Agent Net Payout
                </Typography>
                <Typography sx={{ color: '#E2C05A', fontSize: '24px', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
                  ${selectedTransaction.agent_net_payout?.toLocaleString() || 'N/A'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)} sx={{ color: '#B0B0B0' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>


      {/* Create Payout Dialog */}
      <Dialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#121212', border: '1px solid #2A2A2A' },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 700 }}>
          Create New Commission Payout
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#B0B0B0' }}>Select Agent</InputLabel>
              <Select
                value={createForm.agent_id}
                onChange={(e) => setCreateForm({ ...createForm, agent_id: e.target.value })}
                label="Select Agent"
                sx={{
                  color: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                }}
              >
                {agents.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.full_name} ({agent.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Property Address"
              value={createForm.property_address}
              onChange={(e) => setCreateForm({ ...createForm, property_address: e.target.value })}
              fullWidth
              sx={dashboardStyles.textField}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="City"
                value={createForm.property_city}
                onChange={(e) => setCreateForm({ ...createForm, property_city: e.target.value })}
                fullWidth
                sx={dashboardStyles.textField}
              />
              <TextField
                label="State"
                value={createForm.property_state}
                onChange={(e) => setCreateForm({ ...createForm, property_state: e.target.value })}
                sx={{ ...dashboardStyles.textField, width: '100px' }}
              />
            </Box>

            <TextField
              label="Gross Commission"
              type="number"
              value={createForm.gci}
              onChange={(e) => setCreateForm({ ...createForm, gci: e.target.value })}
              fullWidth
              required
              sx={dashboardStyles.textField}
              InputProps={{
                startAdornment: <Typography sx={{ color: '#B0B0B0', mr: 1 }}>$</Typography>,
              }}
            />

            <FormControl fullWidth>
              <InputLabel sx={{ color: '#B0B0B0' }}>Commission Status</InputLabel>
              <Select
                value={createForm.commission_status}
                onChange={(e) => setCreateForm({ ...createForm, commission_status: e.target.value })}
                label="Commission Status"
                sx={{
                  color: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                }}
              >
                <MenuItem value="pending_approval">Pending Approval</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={() => setCreateDialog(false)} sx={{ color: '#B0B0B0' }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreatePayout}
            variant="contained"
            sx={dashboardStyles.buttonContained}
            disabled={!createForm.agent_id || !createForm.property_address || !createForm.gci}
          >
            Create Payout
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval/Edit Dialog */}
      <Dialog
        open={approvalDialog}
        onClose={handleCloseApprovalDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#121212',
            border: '1px solid #2A2A2A',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 700 }}>
          Edit Commission Payout
        </DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              {/* Transaction Info Only */}
              <Card sx={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', p: 2 }}>
                <Typography sx={{ color: '#B0B0B0', fontSize: '12px', mb: 1 }}>
                  Transaction Details
                </Typography>
                <Typography sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                  {selectedTransaction.users?.full_name} - {selectedTransaction.property_address}
                </Typography>
              </Card>

              {/* Editable Gross Commission */}
              <TextField
                label="Gross Commission"
                type="number"
                value={approvalForm.final_commission_amount}
                onChange={(e) =>
                  setApprovalForm({ ...approvalForm, final_commission_amount: e.target.value })
                }
                fullWidth
                required
                sx={dashboardStyles.textField}
                InputProps={{
                  startAdornment: <Typography sx={{ color: '#B0B0B0', mr: 1 }}>$</Typography>,
                }}
                helperText="This is the total commission amount before splits and fees."
              />

              {/* Split Percentage */}
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#B0B0B0' }}>Brokerage Split</InputLabel>
                <Select
                  value={approvalForm.brokerage_split_percentage}
                  onChange={(e) =>
                    setApprovalForm({ ...approvalForm, brokerage_split_percentage: e.target.value })
                  }
                  label="Brokerage Split"
                  sx={{
                    color: '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#2A2A2A',
                    },
                  }}
                >
                  <MenuItem value="80">80/20 Split (Agent gets 80%)</MenuItem>
                  <MenuItem value="90">90/10 Split (Agent gets 90%)</MenuItem>
                  <MenuItem value="100">No Split (Agent gets 100%)</MenuItem>
                </Select>
              </FormControl>

              {/* Fees Section */}
              <Box>
                <Typography sx={{ color: '#FFFFFF', fontWeight: 600, mb: 2 }}>
                  Fees
                </Typography>

                {/* Add Fee Form */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={7}>
                    <FormControl fullWidth size="small">
                      <Autocomplete
                        freeSolo
                        options={FEE_CATEGORIES}
                        value={feeForm.category}
                        onInputChange={(event, newInputValue) => {
                          setFeeForm({ ...feeForm, category: newInputValue });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Fee Category"
                            sx={{
                              ...dashboardStyles.textField,
                              '& .MuiInputBase-root': {
                                padding: '0px 9px',
                              }
                            }}
                          />
                        )}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={3}>
                    <TextField
                      label="Amount"
                      type="number"
                      value={feeForm.amount}
                      onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                      fullWidth
                      size="small"
                      sx={dashboardStyles.textField}
                      InputProps={{
                        startAdornment: <Typography sx={{ color: '#B0B0B0', mr: 1 }}>$</Typography>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Button
                      variant="outlined"
                      onClick={handleAddFee}
                      fullWidth
                      startIcon={<Add />}
                      sx={{
                        height: '40px',
                        borderColor: '#2A2A2A',
                        color: '#E2C05A',
                        '&:hover': {
                          borderColor: '#E2C05A',
                          backgroundColor: 'rgba(226, 192, 90, 0.08)',
                        },
                      }}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>

                {/* Fees List */}
                {approvalForm.brokerage_fees.map((fee, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #2A2A2A',
                      borderRadius: '8px',
                      padding: '12px',
                      mb: 1,
                    }}
                  >
                    <Box>
                      <Typography sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                        {fee.name}
                      </Typography>
                      <Typography sx={{ color: '#E2C05A', fontSize: '14px', fontFamily: '"JetBrains Mono", monospace' }}>
                        ${fee.amount.toLocaleString()}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveFee(index)}
                      sx={{ color: '#F44336' }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>

              {/* Calculation Summary */}
              <Card sx={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', p: 2 }}>
                <Typography sx={{ color: '#B0B0B0', fontSize: '12px', mb: 2 }}>
                  Payout Calculation
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ color: '#FFFFFF' }}>Gross Commission:</Typography>
                  <Typography sx={{ color: '#FFFFFF', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                    ${(parseFloat(approvalForm.final_commission_amount) || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ color: '#FFFFFF' }}>Agent Split ({approvalForm.brokerage_split_percentage}%):</Typography>
                  <Typography sx={{ color: '#FFFFFF', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                    ${((parseFloat(approvalForm.final_commission_amount) || 0) * (parseFloat(approvalForm.brokerage_split_percentage) / 100)).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ color: '#FFFFFF' }}>Total Fees:</Typography>
                  <Typography sx={{ color: '#F44336', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                    -${calculateTotalFees().toLocaleString()}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1, borderColor: '#2A2A2A' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: '#FFFFFF', fontWeight: 700 }}>Agent Net Payout:</Typography>
                  <Typography sx={{ color: '#E2C05A', fontWeight: 700, fontSize: '18px', fontFamily: '"JetBrains Mono", monospace' }}>
                    ${calculateNetPayout().toLocaleString()}
                  </Typography>
                </Box>
              </Card>

              {/* Payout Notes */}
              <TextField
                label="Payout Notes (Optional)"
                value={approvalForm.payout_notes}
                onChange={(e) =>
                  setApprovalForm({ ...approvalForm, payout_notes: e.target.value })
                }
                fullWidth
                multiline
                rows={3}
                sx={dashboardStyles.textField}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={handleCloseApprovalDialog} sx={{ color: '#B0B0B0' }}>
            Cancel
          </Button>
          <Button
            onClick={handleApproveCommission}
            variant="contained"
            startIcon={<CheckCircle />}
            sx={dashboardStyles.buttonContained}
            disabled={!approvalForm.final_commission_amount}
          >
            Approve & Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
}


