'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Receipt, Eye, DownloadSimple, DotsThreeVertical } from '@phosphor-icons/react';
import { useState } from 'react';
import { generatePayoutPDF } from '@/lib/pdf-generator';

interface Fee {
  name: string;
  amount: number;
}

interface Transaction {
  id: string;
  property_address: string;
  property_city: string;
  property_state: string;
  gci: number;
  final_commission_amount: number | null;
  brokerage_split_percentage: number | null;
  brokerage_fees: Fee[];
  agent_net_payout: number | null;
  commission_status: string;
  closing_date: string | null;
  approved_at: string | null;
  payout_notes: string | null;
  agent_id: string;
  property_zip: string;
  transaction_type: string;
  agent_split_percentage: number;
  agent_commission: number;
  users: {
    full_name: string;
    email: string;
  };
}

export default function PayoutsTab() {
  const supabase = createClient();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);

  // Mobile detection and menu state
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, transactionId: string) => {
    setMenuAnchor(event.currentTarget);
    setSelectedTransactionId(transactionId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedTransactionId(null);
  };

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['commission-payouts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          users:agent_id (
            full_name,
            email
          )
        `)
        .eq('agent_id', user.id)
        .eq('status', 'closed')
        .order('closing_date', { ascending: false });

      return (data || []) as unknown as Transaction[];
    },
  });

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsDialog(true);
  };

  const handleDownloadPayout = async (transaction: Transaction) => {
    try {
      const blob = await generatePayoutPDF(transaction as any);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payout-${transaction.property_address.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate payout PDF');
    }
  };

  const getCommissionStatusChip = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return (
          <Chip
            label="Pending Approval"
            size="small"
            sx={{
              height: '20px',
              fontSize: '0.7rem',
              fontWeight: 500,
              backgroundColor: 'rgba(255, 183, 77, 0.15)',
              border: '1px solid #FFB74D',
              color: '#FFB74D',
            }}
          />
        );
      case 'approved':
        return (
          <Chip
            label="Approved"
            size="small"
            sx={{
              height: '20px',
              fontSize: '0.7rem',
              fontWeight: 500,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #E2C05A',
              color: '#E2C05A',
            }}
          />
        );
      case 'paid':
        return (
          <Chip
            label="Paid"
            size="small"
            sx={{
              height: '20px',
              fontSize: '0.7rem',
              fontWeight: 500,
              backgroundColor: 'rgba(226, 192, 90, 0.15)',
              border: '1px solid #E2C05A',
              color: '#E2C05A',
            }}
          />
        );
      default:
        return null;
    }
  };

  const calculateTotalFees = (fees: Fee[]) => {
    return fees?.reduce((sum, fee) => sum + fee.amount, 0) || 0;
  };

  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography sx={{ color: '#B0B0B0' }}>Loading payouts...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          maxHeight: '65vh',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#0D0D0D',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#2A2A2A',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#333333',
            },
          },
        }}
      >
        {transactions && transactions.length > 0 ? (
          isMobile ? (
            // Mobile: Card Layout
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {transactions.map((transaction) => (
                <Card
                  key={transaction.id}
                  sx={{
                    backgroundColor: '#121212',
                    border: '1px solid #2A2A2A',
                    borderRadius: '8px',
                  }}
                >
                  <CardContent>
                    {/* Header with 3-dot menu */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 0.5 }}>
                          {transaction.property_address}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#808080', fontSize: '0.85rem' }}>
                          {transaction.property_city}, {transaction.property_state}
                        </Typography>
                        {transaction.closing_date && (
                          <Typography variant="caption" sx={{ color: '#808080', display: 'block', mt: 0.5 }}>
                            Closed: {new Date(transaction.closing_date).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, transaction.id)}
                        sx={{ color: '#FFFFFF' }}
                      >
                        <DotsThreeVertical size={20} weight="bold" />
                      </IconButton>
                    </Box>

                    {/* Transaction Details Grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#B0B0B0', display: 'block', mb: 0.5 }}>
                          GCI
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                          ${transaction.final_commission_amount?.toLocaleString() || transaction.gci?.toLocaleString() || '0'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#B0B0B0', display: 'block', mb: 0.5 }}>
                          Split
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                          {transaction.brokerage_split_percentage ? `${transaction.brokerage_split_percentage}%` : 'N/A'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#B0B0B0', display: 'block', mb: 0.5 }}>
                          Fees
                        </Typography>
                        <Typography variant="body2" sx={{ color: transaction.brokerage_fees && transaction.brokerage_fees.length > 0 ? '#F44336' : '#808080', fontWeight: 500 }}>
                          {transaction.brokerage_fees && transaction.brokerage_fees.length > 0
                            ? `-$${calculateTotalFees(transaction.brokerage_fees).toLocaleString()}`
                            : '$0'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#B0B0B0', display: 'block', mb: 0.5 }}>
                          Net Payout
                        </Typography>
                        <Typography variant="body2" sx={{ color: transaction.agent_net_payout !== null ? '#E2C05A' : '#808080', fontWeight: 700 }}>
                          {transaction.agent_net_payout !== null
                            ? `$${transaction.agent_net_payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'Pending'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Status Chip */}
                    <Box>
                      {getCommissionStatusChip(transaction.commission_status)}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            // Desktop: Table Layout
            <TableContainer
              component={Paper}
              sx={{
                backgroundColor: '#121212',
                border: '1px solid #2A2A2A',
                borderRadius: '12px',
              }}
            >
              <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#0D0D0D' }}>
                  <TableCell sx={{ color: '#E2C05A', fontWeight: 700, borderBottom: '1px solid #2A2A2A', fontSize: '0.8rem' }}>
                    Property
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#E2C05A', fontWeight: 700, borderBottom: '1px solid #2A2A2A', fontSize: '0.8rem' }}>
                    GCI
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#E2C05A', fontWeight: 700, borderBottom: '1px solid #2A2A2A', fontSize: '0.8rem' }}>
                    Split
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#E2C05A', fontWeight: 700, borderBottom: '1px solid #2A2A2A', fontSize: '0.8rem' }}>
                    Fees
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#E2C05A', fontWeight: 700, borderBottom: '1px solid #2A2A2A', fontSize: '0.8rem' }}>
                    Net Payout
                  </TableCell>
                  <TableCell align="center" sx={{ color: '#E2C05A', fontWeight: 700, borderBottom: '1px solid #2A2A2A', fontSize: '0.8rem' }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ color: '#E2C05A', fontWeight: 700, borderBottom: '1px solid #2A2A2A', fontSize: '0.8rem' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(226, 192, 90, 0.04)',
                      },
                    }}
                  >
                    <TableCell sx={{ color: '#FFFFFF', borderBottom: '1px solid #2A2A2A' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {transaction.property_address}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#808080' }}>
                        {transaction.property_city}, {transaction.property_state}
                      </Typography>
                      {transaction.closing_date && (
                        <Typography variant="caption" sx={{ color: '#808080', display: 'block', mt: 0.5 }}>
                          Closed: {new Date(transaction.closing_date).toLocaleDateString()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#FFFFFF', borderBottom: '1px solid #2A2A2A' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${transaction.final_commission_amount?.toLocaleString() || transaction.gci?.toLocaleString() || '0'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#FFFFFF', borderBottom: '1px solid #2A2A2A' }}>
                      {transaction.brokerage_split_percentage ? (
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {transaction.brokerage_split_percentage}%
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#808080' }}>
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#F44336', borderBottom: '1px solid #2A2A2A' }}>
                      {transaction.brokerage_fees && transaction.brokerage_fees.length > 0 ? (
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          -${calculateTotalFees(transaction.brokerage_fees).toLocaleString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#808080' }}>
                          $0
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#E2C05A', borderBottom: '1px solid #2A2A2A' }}>
                      {transaction.agent_net_payout !== null ? (
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          ${transaction.agent_net_payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#808080' }}>
                          Pending
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #2A2A2A' }}>
                      {getCommissionStatusChip(transaction.commission_status)}
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #2A2A2A' }}>
                      {transaction.commission_status !== 'pending_approval' && (
                        <Box sx={{ display: 'flex' }}>
                          <Tooltip title="View Breakdown">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(transaction)}
                              sx={{ color: '#E2C05A' }}
                            >
                              <Eye size={18} weight="duotone" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download Statement">
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadPayout(transaction)}
                              sx={{ color: '#10B981', ml: 1 }}
                            >
                              <DownloadSimple size={18} weight="duotone" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          )
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              p: 6,
              border: '2px dashed #2A2A2A',
              borderRadius: '12px',
              backgroundColor: '#121212',
            }}
          >
            <Receipt size={48} color="#4A4A4A" weight="duotone" />
            <Typography variant="h6" sx={{ color: '#B0B0B0', mb: 1, mt: 2 }}>
              No payouts yet
            </Typography>
            <Typography variant="body2" sx={{ color: '#808080' }}>
              Payouts will appear here once transactions are closed and approved
            </Typography>
          </Box>
        )}
      </Box>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
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
          Commission Payout Breakdown
        </DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              {/* Property Info */}
              <Box>
                <Typography sx={{ color: '#B0B0B0', fontSize: '12px', mb: 0.5 }}>
                  Property
                </Typography>
                <Typography sx={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 600 }}>
                  {selectedTransaction.property_address}
                </Typography>
                <Typography sx={{ color: '#808080', fontSize: '14px' }}>
                  {selectedTransaction.property_city}, {selectedTransaction.property_state}
                </Typography>
              </Box>

              {/* Calculation Breakdown */}
              <Paper sx={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', p: 3 }}>
                <Typography sx={{ color: '#B0B0B0', fontSize: '14px', mb: 2, fontWeight: 600 }}>
                  Commission Breakdown
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={8}>
                    <Typography sx={{ color: '#FFFFFF', fontSize: '14px' }}>
                      Gross Commission Income (GCI):
                    </Typography>
                  </Grid>
                  <Grid item xs={4} sx={{ textAlign: 'right' }}>
                    <Typography sx={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 600 }}>
                      ${selectedTransaction.gci?.toLocaleString()}
                    </Typography>
                  </Grid>

                  {selectedTransaction.final_commission_amount && selectedTransaction.final_commission_amount !== selectedTransaction.gci && (
                    <>
                      <Grid item xs={8}>
                        <Typography sx={{ color: '#FFFFFF', fontSize: '14px' }}>
                          Final Commission Amount:
                        </Typography>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: 'right' }}>
                        <Typography sx={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 600 }}>
                          ${selectedTransaction.final_commission_amount.toLocaleString()}
                        </Typography>
                      </Grid>
                    </>
                  )}

                  <Grid item xs={8}>
                    <Typography sx={{ color: '#FFFFFF', fontSize: '14px' }}>
                      Brokerage Split ({selectedTransaction.brokerage_split_percentage}% to you):
                    </Typography>
                  </Grid>
                  <Grid item xs={4} sx={{ textAlign: 'right' }}>
                    <Typography sx={{ color: '#E2C05A', fontSize: '14px', fontWeight: 600 }}>
                      ${((selectedTransaction.final_commission_amount || selectedTransaction.gci) * (selectedTransaction.brokerage_split_percentage! / 100)).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>

                {selectedTransaction.brokerage_fees && selectedTransaction.brokerage_fees.length > 0 && (
                  <>
                    <Divider sx={{ my: 2, borderColor: '#2A2A2A' }} />
                    <Typography sx={{ color: '#B0B0B0', fontSize: '14px', mb: 2, fontWeight: 600 }}>
                      Fees
                    </Typography>
                    {selectedTransaction.brokerage_fees.map((fee: Fee, index: number) => (
                      <Grid container spacing={2} key={index} sx={{ mb: 1 }}>
                        <Grid item xs={8}>
                          <Typography sx={{ color: '#FFFFFF', fontSize: '14px' }}>
                            {fee.name}:
                          </Typography>
                        </Grid>
                        <Grid item xs={4} sx={{ textAlign: 'right' }}>
                          <Typography sx={{ color: '#F44336', fontSize: '14px', fontWeight: 600 }}>
                            -${fee.amount.toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    ))}
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={8}>
                        <Typography sx={{ color: '#B0B0B0', fontSize: '14px' }}>
                          Total Fees:
                        </Typography>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: 'right' }}>
                        <Typography sx={{ color: '#F44336', fontSize: '14px', fontWeight: 600 }}>
                          -${calculateTotalFees(selectedTransaction.brokerage_fees).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </>
                )}

                <Divider sx={{ my: 2, borderColor: '#2A2A2A' }} />

                <Grid container spacing={2}>
                  <Grid item xs={8}>
                    <Typography sx={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 700 }}>
                      Your Net Payout:
                    </Typography>
                  </Grid>
                  <Grid item xs={4} sx={{ textAlign: 'right' }}>
                    <Typography sx={{ color: '#E2C05A', fontSize: '20px', fontWeight: 700 }}>
                      ${selectedTransaction.agent_net_payout?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {selectedTransaction.payout_notes && (
                <Box>
                  <Typography sx={{ color: '#B0B0B0', fontSize: '12px', mb: 1 }}>
                    Notes
                  </Typography>
                  <Paper sx={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', p: 2 }}>
                    <Typography sx={{ color: '#E0E0E0', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                      {selectedTransaction.payout_notes}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {selectedTransaction.approved_at && (
                <Box>
                  <Typography sx={{ color: '#B0B0B0', fontSize: '12px', mb: 0.5 }}>
                    Approved On
                  </Typography>
                  <Typography sx={{ color: '#FFFFFF', fontSize: '14px' }}>
                    {new Date(selectedTransaction.approved_at).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={() => setDetailsDialog(false)} sx={{ color: '#B0B0B0' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mobile Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: '#1A1A1A',
            border: '1px solid #2A2A2A',
            minWidth: 200,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            const transaction = transactions?.find((t) => t.id === selectedTransactionId);
            if (transaction) handleViewDetails(transaction);
            handleMenuClose();
          }}
          sx={{
            color: '#FFFFFF',
            '&:hover': { backgroundColor: '#2A2A2A' },
            py: 1.5,
          }}
        >
          <Eye size={20} weight="duotone" style={{ marginRight: 12 }} />
          View Breakdown
        </MenuItem>
        <MenuItem
          onClick={() => {
            const transaction = transactions?.find((t) => t.id === selectedTransactionId);
            if (transaction) handleDownloadPayout(transaction);
            handleMenuClose();
          }}
          sx={{
            color: '#FFFFFF',
            '&:hover': { backgroundColor: '#2A2A2A' },
            py: 1.5,
          }}
        >
          <DownloadSimple size={20} weight="duotone" style={{ marginRight: 12 }} />
          Download Statement
        </MenuItem>
      </Menu>
    </Box>
  );
}
