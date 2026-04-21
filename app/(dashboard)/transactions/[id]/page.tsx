'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Button,
  Grid,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  InputAdornment,
  Breadcrumbs,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import {
  FileText,
  NotePencil,
  Info,
  ListChecks,
  Upload,
  Plus,
  PencilSimple,
  Check,
  X,
  Users,
  Trash,
  Eye,
  CheckCircle,
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { Delete } from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CommissionStatementModal from '@/components/transactions/CommissionStatementModal';
import { generateCommissionStatement } from '@/lib/utils/pdfGenerator';

interface Fee {
  type: string;
  amount: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`transaction-tabpanel-${index}`}
      aria-labelledby={`transaction-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Document types for Sales transactions
const SALES_DOCUMENTS = [
  { id: 'Fully Executed Contract', label: 'Fully Executed Contract' },
  { id: 'Seller Disclosure', label: 'Seller Disclosure' },
  { id: 'Commission Statement', label: 'Commission Statement' },
  { id: 'Final ALTA/CD', label: 'Final ALTA/CD' },
  { id: 'CIS', label: 'CIS' },
  { id: 'Dual Agency/Informed Consent', label: 'Dual Agency/Informed Consent' },
  { id: 'Lead-Based Paint Disclosure', label: 'Lead-Based Paint Disclosure' },
  { id: 'Other', label: 'Other' },
];

// Document types for Rental transactions
const RENTAL_DOCUMENTS = [
  { id: 'Fully Executed Lease Agreement', label: 'Fully Executed Lease Agreement' },
  { id: 'CIS', label: 'CIS' },
  { id: 'Lead-Based Paint Disclosure', label: 'Lead-Based Paint Disclosure' },
  { id: 'Other', label: 'Other' },
];

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const transactionId = params.id as string;
  const [tabValue, setTabValue] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTransaction, setEditedTransaction] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedContactRole, setSelectedContactRole] = useState<'seller' | 'buyer' | 'other'>('seller');
  const [buyerName, setBuyerName] = useState('');
  const [sellerName, setSellerName] = useState('');



  // Commission statement state
  const [openCommissionModal, setOpenCommissionModal] = useState(false);
  const [closeTransactionDialogOpen, setCloseTransactionDialogOpen] = useState(false);

  // Agent commission state for transaction details
  const [agentCommissionAmount, setAgentCommissionAmount] = useState('');
  const [useAgentSlider, setUseAgentSlider] = useState(false);
  const [agentCommissionPercentage, setAgentCommissionPercentage] = useState(3.0);

  const supabase = createClient();

  const { data: transaction, isLoading } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!transactionId,
  });

  const { data: notes = [], refetch: refetchNotes } = useQuery({
    queryKey: ['transaction-notes', transactionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_notes')
        .select(`
          id,
          note_text,
          created_at,
          agent_id,
          users:agent_id (
            full_name,
            email
          )
        `)
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((note: any) => ({
        id: note.id,
        text: note.note_text,
        created_at: note.created_at,
        created_by: note.users?.full_name || note.users?.email || note.agent_id || 'Unknown User',
      }));
    },
    enabled: !!transactionId,
  });

  const { data: documents = [], refetch: refetchDocuments } = useQuery({
    queryKey: ['transaction-documents', transactionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_documents')
        .select(`
          id,
          document_type,
          file_name,
          file_url,
          file_size,
          uploaded_at,
          uploaded_by,
          uploader:uploaded_by (
            full_name
          )
        `)
        .eq('transaction_id', transactionId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((doc: any) => ({
        ...doc,
        uploader_name: doc.uploader?.full_name || 'Unknown User',
      }));
    },
    enabled: !!transactionId,
  });

  const { data: transactionContacts = [], refetch: refetchTransactionContacts } = useQuery({
    queryKey: ['transaction-contacts', transactionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_contacts')
        .select(`
          id,
          role,
          is_primary,
          notes,
          created_at,
          contact:contact_id (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('transaction_id', transactionId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!transactionId,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('agent_id', user.id)
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });


  const handlePreviewDocument = (doc: any) => {
    if (doc.file_url) {
      // If it's a full URL, use it. If it's a path, construct the public URL.
      // Assuming Supabase storage public URL pattern if not signed
      // But usually we might need a signed URL. For now, matching standard behavior.
      // If file_url is just path:
      const url = doc.file_url.startsWith('http')
        ? doc.file_url
        : `https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/documents/${doc.file_url}`;
      // Ideally we should use supabase.storage.from('documents').getPublicUrl(path)
      // modifying to use getPublicUrl if possible or just window.open if it's already a full URL in DB

      // Better approach using getPublicUrl if it is a path:
      const { data } = supabase.storage.from('documents').getPublicUrl(doc.file_url);
      if (data.publicUrl) window.open(data.publicUrl, '_blank');
      else window.open(doc.file_url, '_blank');
    }
  };

  const handleEditDocument = (doc: any) => {
    setEditingDocumentId(doc.id);
    setDocumentType(doc.document_type);
    setUploadDialogOpen(true);
  };

  const handleUploadDocument = async () => {
    if ((!selectedFile && !editingDocumentId) || !documentType) {
      alert('Please select a file and document type');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let filePath = '';

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        // Use transactionId instead of selectedListing.id
        filePath = `${user.id}/${transactionId}/${Date.now()}.${fileExt}`;

        if (editingDocumentId) {
          const existingDoc = documents?.find((d: any) => d.id === editingDocumentId);
          if (existingDoc && existingDoc.file_url) {
            try {
              // Remove old file if we are replacing it
              await supabase.storage.from('documents').remove([existingDoc.file_url]);
            } catch (e) {
              console.error("Error removing old file", e);
            }
          }
        }

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;
      }

      if (editingDocumentId) {
        const updateData: any = { document_type: documentType };

        if (selectedFile && filePath) {
          updateData.file_name = selectedFile.name;
          updateData.file_url = filePath;
          updateData.file_size = selectedFile.size;
          updateData.uploaded_by = user.id;
          updateData.uploaded_at = new Date().toISOString();
        }

        const { error: dbError } = await supabase
          .from('transaction_documents')
          .update(updateData)
          .eq('id', editingDocumentId);

        if (dbError) throw dbError;
      } else {
        if (!filePath) throw new Error('File path missing for new upload');

        const { error: dbError } = await supabase
          .from('transaction_documents')
          .insert({
            transaction_id: transactionId,
            document_type: documentType,
            file_name: selectedFile!.name,
            file_url: filePath,
            file_size: selectedFile!.size,
            uploaded_by: user.id,
            uploaded_at: new Date().toISOString(),
          });

        if (dbError) throw dbError;
      }

      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentType('');
      setEditingDocumentId(null);
      refetchDocuments(); // Use the refetch function from useQuery
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  // Calculate agent commission when slider is active for transaction details
  useEffect(() => {
    if (useAgentSlider && isEditMode && editedTransaction?.sale_price) {
      const price = parseFloat(editedTransaction.sale_price.toString());
      const calculatedCommission = (price * agentCommissionPercentage) / 100;
      setAgentCommissionAmount(calculatedCommission.toFixed(2));
      setEditedTransaction({ ...editedTransaction, agent_commission_amount: calculatedCommission });
    }
  }, [useAgentSlider, agentCommissionPercentage, editedTransaction?.sale_price, isEditMode]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const { error } = await supabase
      .from('transaction_notes')
      .insert({
        transaction_id: transactionId,
        agent_id: user.id,
        note_text: newNote,
      });

    if (error) {
      console.error('Error saving note:', error);
      return;
    }

    // Refresh the notes list and clear input
    refetchNotes();
    setNewNote('');
  };

  const handleEditClick = () => {
    setEditedTransaction({ ...transaction });
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditedTransaction(null);
    setIsEditMode(false);
  };

  const handleSaveChanges = async () => {
    if (!editedTransaction) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update(editedTransaction)
        .eq('id', transactionId);

      if (error) throw error;

      // Refresh transaction data
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
      setIsEditMode(false);
      setEditedTransaction(null);
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      alert(`Failed to save changes: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };





  const handleSelectContact = (contactId: string, field: 'buyer' | 'seller') => {
    const contact = contacts.find((c: any) => c.id === contactId);
    if (contact) {
      const fullName = `${contact.first_name} ${contact.last_name}`;
      if (field === 'buyer') {
        setBuyerName(fullName);
      } else {
        setSellerName(fullName);
      }
    }
  };

  const handleCloseTransaction = async () => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'closed',
          closing_date: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message || 'Database error occurred');
      }

      setCloseTransactionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
      alert('Transaction closed successfully!');
    } catch (error: any) {
      console.error('Error closing transaction:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      alert(`Failed to close transaction:\n\n${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
    }
  };

  const [cancelTransactionDialogOpen, setCancelTransactionDialogOpen] = useState(false);

  const handleCancelTransaction = async () => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'cancelled',
        })
        .eq('id', transactionId);

      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message || 'Database error occurred');
      }

      setCancelTransactionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
      alert('Transaction cancelled successfully!');
    } catch (error: any) {
      console.error('Error cancelling transaction:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      alert(`Failed to cancel transaction:\n\n${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={dashboardStyles.container}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!transaction) {
    return (
      <Container maxWidth="xl" sx={dashboardStyles.container}>
        <Typography>Transaction not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={dashboardStyles.container}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        separator="›"
        aria-label="breadcrumb"
        sx={{
          mb: 3,
          '& .MuiBreadcrumbs-separator': {
            color: '#808080',
          },
        }}
      >
        <Link
          href="/dashboard/business?tab=transactions"
          style={{
            color: '#E2C05A',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#C4A43B')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#E2C05A')}
        >
          ← Back to Transactions
        </Link>
        <Typography
          sx={{
            color: '#B0B0B0',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Transaction Details
        </Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Transaction Details
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={formatStatus(transaction.status)}
            sx={{
              backgroundColor: `${getStatusColor(transaction.status)}20`,
              color: getStatusColor(transaction.status),
              border: `1px solid ${getStatusColor(transaction.status)}40`,
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
          <Typography variant="body2" sx={dashboardStyles.typography.secondary}>
            {transaction.property_address}, {transaction.property_city}, {transaction.property_state} {transaction.property_zip}
          </Typography>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PencilSimple />}
            onClick={handleEditClick}
            disabled={isEditMode || transaction.status === 'closed'}
            sx={{
              borderColor: '#2A2A2A',
              color: '#FFFFFF',
              '&:hover': {
                borderColor: '#E2C05A',
                backgroundColor: 'rgba(226, 192, 90, 0.08)',
              },
            }}
          >
            Edit Transaction
          </Button>
        </Box>
      </Box>

      <Paper sx={{ ...dashboardStyles.paper, mb: 3 }}>
        <Box sx={{ borderBottom: '1px solid #2A2A2A' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="transaction tabs" sx={dashboardStyles.tabs}>
            <Tab icon={<Info />} iconPosition="start" label="Details" />
            <Tab icon={<FileText />} iconPosition="start" label="Documents" />
            <Tab icon={<NotePencil />} iconPosition="start" label="Notes & Activity" />
            <Tab icon={<Users />} iconPosition="start" label="Contacts" />
          </Tabs>
        </Box>

        {/* Details Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Property Information
                </Typography>
                <TextField
                  fullWidth
                  label="Property Address"
                  value={isEditMode ? editedTransaction?.property_address : transaction.property_address}
                  onChange={(e) => setEditedTransaction({ ...editedTransaction, property_address: e.target.value })}
                  margin="normal"
                  disabled={!isEditMode}
                  sx={dashboardStyles.textField}
                />
                <TextField
                  fullWidth
                  label="City"
                  value={isEditMode ? editedTransaction?.property_city : transaction.property_city}
                  onChange={(e) => setEditedTransaction({ ...editedTransaction, property_city: e.target.value })}
                  margin="normal"
                  disabled={!isEditMode}
                  sx={dashboardStyles.textField}
                />
                <TextField
                  fullWidth
                  label="State"
                  value={isEditMode ? editedTransaction?.property_state : transaction.property_state}
                  onChange={(e) => setEditedTransaction({ ...editedTransaction, property_state: e.target.value })}
                  margin="normal"
                  disabled={!isEditMode}
                  sx={dashboardStyles.textField}
                />
                <TextField
                  fullWidth
                  label="ZIP Code"
                  value={isEditMode ? editedTransaction?.property_zip : transaction.property_zip}
                  onChange={(e) => setEditedTransaction({ ...editedTransaction, property_zip: e.target.value })}
                  margin="normal"
                  disabled={!isEditMode}
                  sx={dashboardStyles.textField}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Financial Information
                </Typography>
                <TextField
                  fullWidth
                  label="Listing Price"
                  value={transaction.listing_price ? `$${transaction.listing_price.toLocaleString()}` : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[$,]/g, '');
                    setEditedTransaction({ ...editedTransaction, listing_price: parseFloat(value) || null });
                  }}
                  margin="normal"
                  disabled={!isEditMode}
                  InputProps={{
                    startAdornment: isEditMode ? <InputAdornment position="start">$</InputAdornment> : undefined,
                  }}
                  sx={dashboardStyles.textField}
                />
                <TextField
                  fullWidth
                  label="Sale Price"
                  value={isEditMode
                    ? (editedTransaction?.sale_price ? editedTransaction.sale_price.toLocaleString() : '')
                    : (transaction.sale_price ? `$${transaction.sale_price.toLocaleString()}` : '')}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[$,]/g, '');
                    setEditedTransaction({ ...editedTransaction, sale_price: parseFloat(value) || null });
                  }}
                  margin="normal"
                  disabled={!isEditMode}
                  InputProps={{
                    startAdornment: isEditMode ? <InputAdornment position="start">$</InputAdornment> : undefined,
                  }}
                  sx={dashboardStyles.textField}
                />
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="body2" gutterBottom sx={{ color: '#B0B0B0', mb: 2 }}>
                    Agent Commission
                  </Typography>
                  <TextField
                    fullWidth
                    label="Commission Amount"
                    type="number"
                    value={useAgentSlider ? agentCommissionAmount : (isEditMode ? (editedTransaction?.agent_commission_amount || '') : (transaction.agent_commission_amount || ''))}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAgentCommissionAmount(value);
                      if (!useAgentSlider) {
                        setEditedTransaction({ ...editedTransaction, agent_commission_amount: parseFloat(value) || 0 });
                      }
                    }}
                    disabled={!isEditMode || useAgentSlider}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        color: '#FFFFFF',
                        '& fieldset': {
                          borderColor: '#3A3A3A',
                        },
                        '&:hover fieldset': {
                          borderColor: '#E2C05A',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#E2C05A',
                        },
                        '&.Mui-disabled': {
                          color: '#808080',
                          '& fieldset': {
                            borderColor: '#2A2A2A',
                          },
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#B0B0B0',
                        '&.Mui-focused': {
                          color: '#E2C05A',
                        },
                        '&.Mui-disabled': {
                          color: '#606060',
                        },
                      },
                    }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={useAgentSlider}
                        onChange={(e) => setUseAgentSlider(e.target.checked)}
                        disabled={!isEditMode}
                        sx={{
                          color: '#E2C05A',
                          '&.Mui-checked': {
                            color: '#E2C05A',
                          },
                          '&.Mui-disabled': {
                            color: '#3A3A3A',
                          },
                        }}
                      />
                    }
                    label="Calculate from percentage"
                    sx={{
                      color: '#B0B0B0',
                      mb: 1,
                      '& .MuiFormControlLabel-label.Mui-disabled': {
                        color: '#606060',
                      },
                    }}
                  />
                  {useAgentSlider && (
                    <>
                      <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 1 }}>
                        {agentCommissionPercentage}%
                      </Typography>
                      <Slider
                        value={agentCommissionPercentage}
                        onChange={(_, value) => setAgentCommissionPercentage(value as number)}
                        min={0}
                        max={10}
                        step={0.1}
                        disabled={!isEditMode}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value}%`}
                        marks={[
                          { value: 0, label: '0%' },
                          { value: 2.5, label: '2.5%' },
                          { value: 5, label: '5%' },
                          { value: 10, label: '10%' },
                        ]}
                        sx={{
                          color: '#E2C05A',
                          '& .MuiSlider-thumb': {
                            backgroundColor: '#E2C05A',
                            '&:hover, &.Mui-focusVisible': {
                              boxShadow: '0 0 0 8px rgba(226, 192, 90, 0.16)',
                            },
                          },
                          '& .MuiSlider-track': {
                            backgroundColor: '#E2C05A',
                          },
                          '& .MuiSlider-rail': {
                            backgroundColor: '#3A3A3A',
                          },
                          '& .MuiSlider-mark': {
                            backgroundColor: '#3A3A3A',
                          },
                          '& .MuiSlider-markLabel': {
                            color: '#808080',
                            fontSize: '0.75rem',
                          },
                          '&.Mui-disabled': {
                            color: '#3A3A3A',
                            '& .MuiSlider-thumb': {
                              backgroundColor: '#3A3A3A',
                            },
                          },
                        }}
                      />
                    </>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Important Dates
                </Typography>
                <TextField
                  fullWidth
                  label="Listing Date"
                  type={isEditMode ? "date" : "text"}
                  value={isEditMode
                    ? editedTransaction?.listing_date?.split('T')[0] || ''
                    : transaction.listing_date ? new Date(transaction.listing_date).toLocaleDateString() : ''}
                  onChange={(e) => setEditedTransaction({ ...editedTransaction, listing_date: e.target.value })}
                  margin="normal"
                  disabled={!isEditMode}
                  InputLabelProps={isEditMode ? { shrink: true } : undefined}
                  sx={dashboardStyles.textField}
                />
                <TextField
                  fullWidth
                  label="Contingency Date"
                  type={isEditMode ? "date" : "text"}
                  value={isEditMode
                    ? editedTransaction?.contingency_date?.split('T')[0] || ''
                    : transaction.contingency_date ? new Date(transaction.contingency_date).toLocaleDateString() : ''}
                  onChange={(e) => setEditedTransaction({ ...editedTransaction, contingency_date: e.target.value })}
                  margin="normal"
                  disabled={!isEditMode}
                  InputLabelProps={isEditMode ? { shrink: true } : undefined}
                  sx={dashboardStyles.textField}
                />
                <TextField
                  fullWidth
                  label="Closing Date"
                  type={isEditMode ? "date" : "text"}
                  value={isEditMode
                    ? editedTransaction?.closing_date?.split('T')[0] || ''
                    : transaction.closing_date ? new Date(transaction.closing_date).toLocaleDateString() : ''}
                  onChange={(e) => setEditedTransaction({ ...editedTransaction, closing_date: e.target.value })}
                  margin="normal"
                  disabled={!isEditMode}
                  InputLabelProps={isEditMode ? { shrink: true } : undefined}
                  sx={dashboardStyles.textField}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {!isEditMode ? (
                      <>

                        <Button
                          variant="outlined"
                          component="a"
                          href="https://www.zipformplus.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={dashboardStyles.button}
                        >
                          Write Contract in ZipForms
                        </Button>

                        <Button
                          variant="outlined"
                          onClick={() => setOpenCommissionModal(true)}
                          sx={dashboardStyles.button}
                        >
                          Generate Commission Statement
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="contained"
                          startIcon={<Check size={20} weight="duotone" />}
                          onClick={handleSaveChanges}
                          disabled={saving}
                          sx={{ ...dashboardStyles.button, backgroundColor: '#22C55E', '&:hover': { backgroundColor: '#16A34A' } }}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<X size={20} weight="duotone" />}
                          onClick={handleCancelEdit}
                          disabled={saving}
                          sx={dashboardStyles.button}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </Box>
                  {!isEditMode && transaction.status !== 'closed' && transaction.status !== 'cancelled' && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<X size={20} weight="duotone" />}
                        onClick={() => setCancelTransactionDialogOpen(true)}
                        sx={{
                          borderColor: '#EF4444',
                          color: '#EF4444',
                          textTransform: 'none',
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: '#DC2626',
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                          },
                        }}
                      >
                        Cancel Transaction
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<CheckCircle size={20} weight="duotone" />}
                        onClick={() => setCloseTransactionDialogOpen(true)}
                        sx={{
                          backgroundColor: '#22C55E',
                          color: '#FFFFFF',
                          textTransform: 'none',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: '#16A34A',
                          },
                        }}
                      >
                        Close Transaction
                      </Button>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Documents Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Documents
              </Typography>
              <Button
                variant="contained"
                startIcon={<Upload size={20} weight="duotone" />}
                onClick={() => setUploadDialogOpen(true)}
                sx={dashboardStyles.button}
              >
                Upload Document
              </Button>
            </Box>
            {documents.length > 0 ? (
              <List>
                {documents.map((doc: any) => (
                  <ListItem
                    key={doc.id}
                    sx={{
                      backgroundColor: '#121212',
                      border: '1px solid #2A2A2A',
                      borderRadius: '8px',
                      mb: 1,
                      '&:hover': {
                        borderColor: '#333333',
                        backgroundColor: '#1A1A1A',
                      },
                    }}
                  >
                    <ListItemText
                      primary={doc.file_name}
                      secondary={`${doc.document_type} • Uploaded by ${doc.uploader_name} • ${new Date(doc.uploaded_at).toLocaleDateString()}`}
                      primaryTypographyProps={{ sx: { color: '#FFFFFF', fontWeight: 500 } }}
                      secondaryTypographyProps={{ sx: { color: '#808080', fontSize: '0.85rem' } }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        onClick={() => handlePreviewDocument(doc)}
                        sx={{
                          color: '#E2C05A',
                          '&:hover': { backgroundColor: 'rgba(226, 192, 90, 0.08)' },
                        }}
                        size="small"
                        title="Preview document"
                      >
                        <Eye size={20} />
                      </IconButton>
                      <IconButton
                        onClick={() => handleEditDocument(doc)}
                        sx={{
                          color: '#E2C05A',
                          '&:hover': { backgroundColor: 'rgba(226, 192, 90, 0.08)' },
                        }}
                        size="small"
                        title="Edit document"
                      >
                        <PencilSimple size={20} />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Paper sx={{ ...dashboardStyles.paper, p: 3, textAlign: 'center' }}>
                <Typography variant="body2" sx={dashboardStyles.typography.secondary}>
                  No documents uploaded yet
                </Typography>
              </Paper>
            )}
          </Box>
        </TabPanel>

        {/* Notes & Activity Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            {/* Add Note Section */}
            <Paper sx={{ ...dashboardStyles.paper, p: 2, mb: 3, backgroundColor: '#121212', border: '1px solid #2A2A2A' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#FFFFFF' }}>
                Add Note
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Write a note about this transaction..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#FFFFFF',
                      backgroundColor: '#0D0D0D',
                      '& fieldset': { borderColor: '#3A3A3A' },
                      '&:hover fieldset': { borderColor: '#E2C05A' },
                      '&.Mui-focused fieldset': { borderColor: '#E2C05A' },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<Plus size={20} weight="duotone" />}
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  sx={{
                    backgroundColor: '#E2C05A',
                    '&:hover': { backgroundColor: '#C4A43B' },
                    '&.Mui-disabled': { backgroundColor: '#2A2A2A', color: '#808080' },
                  }}
                >
                  Add
                </Button>
              </Box>
            </Paper>

            {/* Notes & Activity Timeline */}
            <Typography variant="h6" sx={{ mb: 2, color: '#FFFFFF' }}>
              Timeline
            </Typography>
            {notes.length === 0 ? (
              <Paper sx={{ ...dashboardStyles.paper, p: 4, textAlign: 'center', backgroundColor: '#121212', border: '1px solid #2A2A2A' }}>
                <NotePencil size={48} color="#4A4A4A" weight="duotone" />
                <Typography variant="body2" sx={{ color: '#808080', mt: 2 }}>
                  No notes yet. Add your first note above.
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {notes.map((note) => (
                  <Paper key={note.id} sx={{ ...dashboardStyles.paper, p: 2, backgroundColor: '#121212', border: '1px solid #2A2A2A' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: '#E2C05A20',
                          border: '1px solid #E2C05A40',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <NotePencil size={20} color="#E2C05A" weight="duotone" />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                            {note.created_by}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#808080' }}>
                            {new Date(note.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#B0B0B0', whiteSpace: 'pre-wrap' }}>
                          {note.text}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Contacts Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#FFFFFF' }}>
                Associated Contacts
              </Typography>
              <Button
                variant="contained"
                startIcon={<Plus size={20} weight="duotone" />}
                onClick={() => setAddContactDialogOpen(true)}
                sx={{ backgroundColor: '#E2C05A', '&:hover': { backgroundColor: '#C4A43B' } }}
              >
                Add Contact
              </Button>
            </Box>

            {transactionContacts.length === 0 ? (
              <Paper sx={{ ...dashboardStyles.paper, p: 4, textAlign: 'center', backgroundColor: '#121212', border: '1px solid #2A2A2A' }}>
                <Users size={48} color="#4A4A4A" weight="duotone" />
                <Typography variant="body2" sx={{ color: '#808080', mt: 2 }}>
                  No contacts associated yet. Add contacts to this transaction.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {transactionContacts.map((tc: any) => (
                  <Grid item xs={12} md={6} key={tc.id}>
                    <Paper sx={{ ...dashboardStyles.paper, p: 2, backgroundColor: '#121212', border: '1px solid #2A2A2A' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 0.5 }}>
                            {tc.contact?.first_name} {tc.contact?.last_name}
                          </Typography>
                          <Chip
                            label={tc.role.charAt(0).toUpperCase() + tc.role.slice(1)}
                            size="small"
                            sx={{
                              backgroundColor: tc.is_primary ? '#E2C05A' : '#2A2A2A',
                              color: tc.is_primary ? '#FFFFFF' : '#B0B0B0',
                              mb: 1,
                            }}
                          />
                          {tc.contact?.email && (
                            <Typography variant="body2" sx={{ color: '#B0B0B0', fontSize: '0.875rem' }}>
                              {tc.contact.email}
                            </Typography>
                          )}
                          {tc.contact?.phone && (
                            <Typography variant="body2" sx={{ color: '#B0B0B0', fontSize: '0.875rem' }}>
                              {tc.contact.phone}
                            </Typography>
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={async () => {
                            await supabase.from('transaction_contacts').delete().eq('id', tc.id);
                            refetchTransactionContacts();
                          }}
                          sx={{ color: '#EF4444' }}
                        >
                          <Trash size={20} />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* Add Contact Dialog */}
      <Dialog
        open={addContactDialogOpen}
        onClose={() => {
          setAddContactDialogOpen(false);
          setSelectedContactId('');
          setSelectedContactRole('seller');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#121212',
            border: '1px solid #2A2A2A',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 700 }}>
          Add Contact to Transaction
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#B0B0B0' }}>Select Contact</InputLabel>
              <Select
                value={selectedContactId}
                label="Select Contact"
                onChange={(e) => setSelectedContactId(e.target.value)}
                sx={dashboardStyles.textField}
              >
                {contacts.filter((c: any) => !transactionContacts.some((tc: any) => tc.contact?.id === c.id)).map((contact: any) => (
                  <MenuItem key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name} - {contact.email || contact.phone}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel sx={{ color: '#B0B0B0' }}>Role</InputLabel>
              <Select
                value={selectedContactRole}
                label="Role"
                onChange={(e) => setSelectedContactRole(e.target.value as any)}
                sx={dashboardStyles.textField}
              >
                <MenuItem value="seller">Seller</MenuItem>
                <MenuItem value="buyer">Buyer</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button
            onClick={() => {
              setAddContactDialogOpen(false);
              setSelectedContactId('');
              setSelectedContactRole('seller');
            }}
            sx={{ color: '#808080' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!selectedContactId) return;

              await supabase.from('transaction_contacts').insert({
                transaction_id: transactionId,
                contact_id: selectedContactId,
                role: selectedContactRole,
                is_primary: transactionContacts.length === 0,
              });

              refetchTransactionContacts();
              setAddContactDialogOpen(false);
              setSelectedContactId('');
              setSelectedContactRole('seller');
            }}
            disabled={!selectedContactId}
            sx={{
              backgroundColor: '#E2C05A',
              '&:hover': { backgroundColor: '#C4A43B' },
              '&.Mui-disabled': { backgroundColor: '#2A2A2A', color: '#808080' },
            }}
          >
            Add Contact
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false);
          setSelectedFile(null);
          setDocumentType('');
          setIsDragging(false);
          setEditingDocumentId(null);
        }}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: '#121212',
            border: '1px solid #2A2A2A',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF' }}>
          {editingDocumentId ? 'Edit Document' : 'Upload Document'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
            <InputLabel sx={{ color: '#B0B0B0' }}>Document Type</InputLabel>
            <Select
              value={documentType}
              label="Document Type"
              onChange={(e) => setDocumentType(e.target.value)}
              sx={{
                backgroundColor: '#0D0D0D',
                color: '#FFFFFF',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E2C05A' },
              }}
            >
              {(transaction?.transaction_type === 'rental' ? RENTAL_DOCUMENTS : SALES_DOCUMENTS).map((doc) => {
                const isUploaded = documents.some((d: any) => d.document_type === doc.id);
                return (
                  <MenuItem
                    key={doc.id}
                    value={doc.id}
                    disabled={isUploaded && !editingDocumentId}
                    sx={{
                      '&.Mui-disabled': {
                        opacity: 0.5,
                        color: '#808080',
                      },
                    }}
                  >
                    {doc.label} {isUploaded && '(Uploaded)'}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <Box
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              p: 4,
              border: `2px dashed ${isDragging ? '#E2C05A' : '#3A3A3A'}`,
              borderRadius: '8px',
              backgroundColor: isDragging ? 'rgba(226, 192, 90, 0.05)' : '#121212',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#E2C05A',
                backgroundColor: 'rgba(226, 192, 90, 0.05)',
              },
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Upload size={48} color={isDragging ? '#E2C05A' : '#B0B0B0'} weight="duotone" style={{ marginBottom: 16 }} />
            {selectedFile ? (
              <Box>
                <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 1 }}>
                  {selectedFile.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#B0B0B0', fontSize: '0.85rem' }}>
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 1 }}>
                  Drop your file here
                </Typography>
                <Typography variant="body2" sx={{ color: '#B0B0B0', fontSize: '0.85rem' }}>
                  or click to browse
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setUploadDialogOpen(false);
              setSelectedFile(null);
              setDocumentType('');
              setIsDragging(false);
              setEditingDocumentId(null);
            }}
            sx={{ color: '#B0B0B0' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={(!selectedFile && !editingDocumentId) || !documentType || uploading}
            onClick={handleUploadDocument}
            sx={{
              backgroundColor: '#E2C05A',
              '&:hover': { backgroundColor: '#C4A43B' },
              '&.Mui-disabled': { backgroundColor: '#2A2A2A', color: '#808080' },
            }}
          >
            {uploading ? (editingDocumentId ? 'Updating...' : 'Uploading...') : (editingDocumentId ? 'Update' : 'Upload')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Commission Statement Modal */}
      <CommissionStatementModal
        open={openCommissionModal}
        onClose={() => setOpenCommissionModal(false)}
        transaction={transaction}
      />

      {/* Close Transaction Confirmation Dialog */}
      <Dialog
        open={closeTransactionDialogOpen}
        onClose={() => setCloseTransactionDialogOpen(false)}
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
        <DialogTitle sx={{ color: '#FFFFFF', borderBottom: '1px solid #2A2A2A' }}>
          Close Transaction
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ color: '#E0E0E0', mb: 2 }}>
            Are you sure you want to close this transaction?
          </Typography>
          <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
            This will mark the transaction as completed and set the closing date to today.
            You can still access transaction details and documents after closing.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #2A2A2A' }}>
          <Button onClick={() => setCloseTransactionDialogOpen(false)} sx={{ color: '#B0B0B0' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCloseTransaction}
            sx={{
              backgroundColor: '#22C55E',
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: '#16A34A',
              },
            }}
          >
            Close Transaction
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Transaction Confirmation Dialog */}
      <Dialog
        open={cancelTransactionDialogOpen}
        onClose={() => setCancelTransactionDialogOpen(false)}
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
        <DialogTitle sx={{ color: '#FFFFFF', borderBottom: '1px solid #2A2A2A' }}>
          Cancel Transaction
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ color: '#E0E0E0', mb: 2 }}>
            Are you sure you want to cancel this transaction?
          </Typography>
          <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
            This will mark the transaction as cancelled. You can still access transaction details and documents.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #2A2A2A' }}>
          <Button onClick={() => setCancelTransactionDialogOpen(false)} sx={{ color: '#B0B0B0' }}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleCancelTransaction}
            sx={{
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: '#DC2626',
              },
            }}
          >
            Cancel Transaction
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

