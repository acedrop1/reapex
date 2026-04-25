'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/lib/utils/auth';
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
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  MagnifyingGlass as SearchIcon,
  Eye as ViewIcon,
  FileText,
  Download,
  X,
  Archive,
} from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  agent_id: string;
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  listing_price: number | null;
  sale_price: number | null;
  gci: number;
  agent_commission: number;
  status: string;
  transaction_type: string;
  agency_type: string | null;
  closing_date: string | null;
  created_at: string;
  users: {
    full_name: string;
    email: string;
  };
}

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
  uploader_name: string | null;
}

export default function AdminTransactionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Check admin access and fetch transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return [];
      }

      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userProfile || !isAdmin(userProfile.role)) {
        router.push('/dashboard');
        return [];
      }

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          users:agent_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleViewDocuments = async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDocumentsDialogOpen(true);
    setLoadingDocuments(true);

    try {
      const { data, error } = await supabase
        .from('transaction_documents')
        .select(`
          *,
          uploader:uploaded_by (
            full_name
          )
        `)
        .eq('transaction_id', transaction.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      const documentsWithUploader = data?.map((doc: any) => ({
        ...doc,
        uploader_name: doc.uploader?.full_name || 'Unknown User',
      })) || [];

      setDocuments(documentsWithUploader);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'archived' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] }); // Correctly using captured queryClient
    },
  });

  const handleArchive = (id: string) => {
    if (window.confirm('Are you sure you want to archive this transaction?')) {
      archiveMutation.mutate(id);
    }
  };

  const handleDownloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_url, 60);

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Error downloading document:', error);
      alert(`Failed to download document: ${error.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed':
        return '#22C55E';
      case 'under_contract':
        return '#FBBF24';
      case 'pending':
        return '#E2C05A';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#808080';
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const filteredTransactions = transactions?.filter((transaction) =>
    [
      transaction.property_address,
      transaction.property_city,
      transaction.users?.full_name,
      transaction.users?.email,
    ].some(field =>
      field?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0D0D0D' }}>
      {/* Filter Bar - Sticky */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 5, p: 2, backgroundColor: '#121212', borderBottom: '1px solid #2A2A2A', display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
        <TextField
          fullWidth
          placeholder="Search transactions by address, city, agent name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon size={20} color="#666" />
              </InputAdornment>
            ),
            sx: {
              backgroundColor: '#2A2A2A',
              color: '#FFFFFF',
              '& fieldset': { border: 'none' },
              borderRadius: 1
            }
          }}
          size="small"
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
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#2A2A2A' }}>
              <TableCell sx={{ color: '#B0B0B0', fontWeight: 600 }}>Property</TableCell>
              <TableCell sx={{ color: '#B0B0B0', fontWeight: 600 }}>Agent</TableCell>
              <TableCell sx={{ color: '#B0B0B0', fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ color: '#B0B0B0', fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ color: '#B0B0B0', fontWeight: 600 }}>GCI</TableCell>
              <TableCell align="right" sx={{ color: '#B0B0B0', fontWeight: 600 }}>Commission</TableCell>
              <TableCell sx={{ color: '#B0B0B0', fontWeight: 600 }}>Closing Date</TableCell>
              <TableCell align="center" sx={{ color: '#B0B0B0', fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#808080' }}>
                  {searchTerm ? 'No transactions found matching your search' : 'No transactions found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                      {transaction.property_address}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#808080' }}>
                      {transaction.property_city}, {transaction.property_state} {transaction.property_zip}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                      {transaction.users?.full_name || 'Unknown Agent'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#808080' }}>
                      {transaction.users?.email || 'No email'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={(transaction.agency_type || 'seller').charAt(0).toUpperCase() + (transaction.agency_type || 'seller').slice(1)}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(226, 192, 90, 0.1)',
                        color: '#E2C05A',
                        border: '1px solid #E2C05A',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatStatus(transaction.status)}
                      size="small"
                      sx={{
                        backgroundColor: `${getStatusColor(transaction.status)}20`,
                        color: getStatusColor(transaction.status),
                        border: `1px solid ${getStatusColor(transaction.status)}40`,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ color: '#FFFFFF', fontFamily: '"JetBrains Mono", monospace' }}>
                      ${transaction.gci.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ color: '#FFFFFF', fontFamily: '"JetBrains Mono", monospace' }}>
                      ${transaction.agent_commission.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                      {transaction.closing_date ? format(new Date(transaction.closing_date), 'MMM dd, yyyy') : 'Not set'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/transactions/${transaction.id}`)}
                      sx={{ color: '#E2C05A', mr: 1 }}
                    >
                      <ViewIcon size={20} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDocuments(transaction)}
                      sx={{ color: '#E2C05A', mr: 1 }}
                    >
                      <FileText size={20} />
                    </IconButton>
                    <Tooltip title="Archive">
                      <IconButton
                        size="small"
                        onClick={() => handleArchive(transaction.id)}
                        sx={{ color: '#F44336' }}
                      >
                        <Archive size={20} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Documents Dialog */}
      <Dialog
        open={documentsDialogOpen}
        onClose={() => {
          setDocumentsDialogOpen(false);
          setSelectedTransaction(null);
          setDocuments([]);
        }}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: '#121212',
            border: '1px solid #2A2A2A',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Transaction Documents</Typography>
            {selectedTransaction && (
              <Typography variant="body2" sx={{ color: '#808080', mt: 0.5 }}>
                {selectedTransaction.property_address}, {selectedTransaction.property_city}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={() => {
              setDocumentsDialogOpen(false);
              setSelectedTransaction(null);
              setDocuments([]);
            }}
            sx={{ color: '#808080' }}
          >
            <X size={24} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loadingDocuments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : documents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <FileText size={48} color="#4A4A4A" weight="duotone" />
              <Typography variant="body2" sx={{ color: '#808080', mt: 2 }}>
                No documents uploaded yet
              </Typography>
            </Box>
          ) : (
            <List>
              {documents.map((doc) => (
                <ListItem
                  key={doc.id}
                  sx={{
                    backgroundColor: '#0D0D0D',
                    borderRadius: '8px',
                    mb: 1,
                    border: '1px solid #2A2A2A',
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleDownloadDocument(doc)}
                      sx={{ color: '#E2C05A' }}
                    >
                      <Download size={20} />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <FileText size={24} color="#E2C05A" weight="duotone" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                        {doc.file_name}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" sx={{ color: '#808080' }}>
                          {doc.document_type} • {formatFileSize(doc.file_size)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#808080', display: 'block' }}>
                          Uploaded by {doc.uploader_name} on {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDocumentsDialogOpen(false);
              setSelectedTransaction(null);
              setDocuments([]);
            }}
            sx={{ color: '#B0B0B0' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
