'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Card,
    CardContent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Slider,
    IconButton,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Alert,
    Checkbox,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Tabs,
    Tab,
    Menu,
    useTheme,
    useMediaQuery,
    Autocomplete,
    CircularProgress,
} from '@mui/material';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import { Add, Delete, Description, CheckCircle, RadioButtonUnchecked, Upload } from '@mui/icons-material';
import { generateCommissionStatement } from '@/lib/utils/pdfGenerator';
import Link from 'next/link';
import { House, Eye, DotsThreeVertical } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

interface Fee {
    type: string;
    amount: number;
}

const REQUIRED_DOCUMENTS = [
    {
        id: 'Fully Executed Contract',
        name: 'Fully Executed Contract',
        description: 'Signed by all parties',
    },
    {
        id: 'CIS',
        name: 'CIS',
        description: 'Dated prior to or at the time of contract',
    },
    {
        id: 'Dual Agency/Informed Consent',
        name: 'Dual Agency/Informed Consent',
        description: 'If applicable - when Reapex represents both sides',
    },
    {
        id: 'Seller Disclosure',
        name: 'Seller Disclosure',
        description: 'Record of what the seller disclosed',
    },
    {
        id: 'Lead-Based Paint Disclosure',
        name: 'Lead-Based Paint Disclosure',
        description: 'For homes built pre-1978',
    },
    {
        id: 'Proof of Deposit',
        name: 'Proof of Deposit',
        description: 'Copy of check or wire receipt',
    },
    {
        id: 'Commission Statement',
        name: 'Commission Statement',
        description: 'Invoice sent to closing attorney/title company',
    },
    {
        id: 'Final ALTA/CD',
        name: 'Final ALTA/CD',
        description: 'Required to finalize close',
    },
];

import CommissionStatementModal from '@/components/transactions/CommissionStatementModal';

interface TransactionsTabProps {
    userProfile: any;
}

export default function TransactionsTab({ userProfile }: TransactionsTabProps) {
    const supabase = createClient();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [tabValue, setTabValue] = useState(0);
    const [openCommissionModal, setOpenCommissionModal] = useState(false);
    const [openCloseModal, setOpenCloseModal] = useState(false);
    const [openNewTransactionModal, setOpenNewTransactionModal] = useState(false);
    const [selectedListing, setSelectedListing] = useState<any>(null);
    const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);

    // Document state
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState('');
    const [uploading, setUploading] = useState(false);
    const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);

    // Mobile detection and menu state
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

    // New transaction form state
    const [newTransactionType, setNewTransactionType] = useState<'sale' | 'rental'>('sale');
    const [newAgencyType, setNewAgencyType] = useState('seller');
    const [newPropertyAddress, setNewPropertyAddress] = useState('');
    const [newPropertyCity, setNewPropertyCity] = useState('');
    const [newPropertyState, setNewPropertyState] = useState('');
    const [newPropertyZip, setNewPropertyZip] = useState('');
    const [newPropertyType, setNewPropertyType] = useState('single_family_home');
    const [newPrice, setNewPrice] = useState('');
    const [newCoverImage, setNewCoverImage] = useState('');

    // Listing selection for new transaction
    const [selectedNewTransactionListingId, setSelectedNewTransactionListingId] = useState<string | null>(null);
    const [selectedNewTransactionListing, setSelectedNewTransactionListing] = useState<any | null>(null);

    // Menu handlers
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, transactionId: string) => {
        setMenuAnchor(event.currentTarget);
        setSelectedTransactionId(transactionId);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedTransactionId(null);
    };

    const { data: listings } = useQuery({
        queryKey: ['listings'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('listings')
                .select('id, property_address, property_city, property_state, property_zip, property_type, listing_type, price, cover_image, status')
                .eq('agent_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
    });

    const { data: transactions } = useQuery({
        queryKey: ['transactions'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('agent_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Convert storage paths to signed URLs for cover images
            const transactionsWithSignedUrls = await Promise.all(
                (data || []).map(async (transaction) => {
                    if (transaction.cover_image && !transaction.cover_image.startsWith('http')) {
                        // It's a storage path, get signed URL
                        try {
                            const { data: signedUrlData } = await supabase.storage
                                .from('listings')
                                .createSignedUrl(transaction.cover_image, 3600); // 1 hour expiry

                            if (signedUrlData?.signedUrl) {
                                return { ...transaction, cover_image: signedUrlData.signedUrl };
                            }
                        } catch (err) {
                            console.error('Error generating signed URL for cover image:', err);
                        }
                    }
                    return transaction;
                })
            );

            return transactionsWithSignedUrls;
        },
    });

    const { data: uploadedDocuments } = useQuery({
        queryKey: ['transaction-documents', selectedListing?.id],
        queryFn: async () => {
            if (!selectedListing?.id) return [];

            const { data, error } = await supabase
                .from('transaction_documents')
                .select('*')
                .eq('transaction_id', selectedListing.id);

            if (error) throw error;
            return data || [];
        },
        enabled: !!selectedListing?.id,
    });

    // Separate pending and closed transactions
    const pendingTransactions = transactions?.filter(t => t.status === 'pending') || [];

    const closedTransactions = transactions?.filter(t => t.status === 'closed') || [];

    // Filter listings by transaction type for new transaction modal
    const filteredListings = useMemo(() => {
        if (!listings) return [];

        const typeMap = {
            'sale': 'for_sale',
            'rental': 'for_rent'
        };

        return listings.filter(listing =>
            listing.listing_type === typeMap[newTransactionType] &&
            listing.status === 'active'
        );
    }, [listings, newTransactionType]);

    // Handle listing selection for new transaction modal
    const handleListingSelect = (listing: any | null) => {
        if (!listing) {
            // Clear mode - reset to manual entry
            setSelectedNewTransactionListingId(null);
            setSelectedNewTransactionListing(null);
            setNewPropertyAddress('');
            setNewPropertyCity('');
            setNewPropertyState('');
            setNewPropertyZip('');
            setNewPropertyType('single_family_home');
            setNewPrice('');
            setNewCoverImage('');
            return;
        }

        // Auto-populate all fields from listing
        setSelectedNewTransactionListingId(listing.id);
        setSelectedNewTransactionListing(listing);
        setNewTransactionType(listing.listing_type === 'for_sale' ? 'sale' : 'rental');
        setNewPropertyType(listing.property_type);
        setNewPropertyAddress(listing.property_address);
        setNewPropertyCity(listing.property_city);
        setNewPropertyState(listing.property_state);
        setNewPropertyZip(listing.property_zip || '');
        setNewPrice(listing.price?.toString() || '');
        setNewCoverImage(listing.cover_image || '');
    };

    const handleOpenCommissionModal = (listing: any) => {
        setSelectedListing(listing);
        setOpenCommissionModal(true);
    };

    const handleOpenCloseModal = (listing: any) => {
        setSelectedListing(listing);
        setOpenCloseModal(true);
    };

    const handleCloseTransaction = async () => {
        if (!selectedListing) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('You must be logged in to close a transaction.');
                return;
            }

            // Validate required listing fields
            const missingFields = [];
            if (!selectedListing.property_address) missingFields.push('Property Address');
            if (!selectedListing.property_city) missingFields.push('City');
            if (!selectedListing.property_state) missingFields.push('State');
            if (!selectedListing.listing_type) missingFields.push('Listing Type');

            if (missingFields.length > 0) {
                alert(`Cannot close transaction. Missing required fields:\n${missingFields.join(', ')}\n\nPlease update the listing with all required information before closing.`);
                setOpenCloseModal(false);
                return;
            }

            // Determine transaction and agency type based on listing type
            const transactionType = selectedListing.listing_type === 'for_rent' ? 'rental' : 'sale';
            const agencyType = selectedListing.listing_type === 'for_rent' ? 'landlord' : 'seller';

            // Create transaction record
            const { error } = await supabase
                .from('transactions')
                .insert({
                    listing_id: selectedListing.id,
                    agent_id: user.id,
                    property_address: selectedListing.property_address,
                    property_city: selectedListing.property_city,
                    property_state: selectedListing.property_state,
                    property_zip: selectedListing.property_zip || '',
                    transaction_type: transactionType,
                    agency_type: agencyType,
                    status: 'closed',
                    closing_date: new Date().toISOString(),
                });

            if (error) {
                console.error('Database error:', error);
                throw new Error(error.message || 'Database error occurred');
            }

            // Update listing status
            const { error: updateError } = await supabase
                .from('listings')
                .update({ status: 'closed' })
                .eq('id', selectedListing.id);

            if (updateError) {
                console.error('Error updating listing status:', updateError);
                // Transaction was created but listing status update failed
                alert('Transaction was created but listing status could not be updated. Please contact support.');
                return;
            }

            setOpenCloseModal(false);
            setSelectedListing(null);

            // Refresh data
            window.location.reload();
        } catch (error: any) {
            console.error('Error closing transaction:', error);
            const errorMessage = error.message || 'An unknown error occurred';
            alert(`Failed to close transaction:\n\n${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
        }
    };

    const handleCreateNewTransaction = async () => {
        if (!newPropertyAddress || !newPropertyCity || !newPropertyState || !newPropertyZip || !newPrice) {
            alert('Please fill in all required fields');
            return;
        }

        setIsCreatingTransaction(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('You must be logged in to create a transaction');
                setIsCreatingTransaction(false);
                return;
            }

            // Create a new transaction
            const transactionData: any = {
                agent_id: user.id,
                transaction_type: newTransactionType,
                agency_type: newAgencyType,
                property_type: newPropertyType,
                property_address: newPropertyAddress,
                property_city: newPropertyCity,
                property_state: newPropertyState,
                property_zip: newPropertyZip,
                listing_price: parseFloat(newPrice),
                status: 'pending',
            };

            // Add listing_id if a listing was selected
            if (selectedNewTransactionListingId) {
                transactionData.listing_id = selectedNewTransactionListingId;
            }

            // Add cover_image if available
            if (newCoverImage) {
                transactionData.cover_image = newCoverImage;
            }

            const { data, error } = await supabase
                .from('transactions')
                .insert(transactionData)
                .select()
                .single();

            if (error) {
                console.error('Database error:', error);
                throw new Error(error.message || 'Failed to create transaction');
            }

            console.log('Transaction created successfully:', data);

            // Reset form
            setNewTransactionType('sale');
            setNewAgencyType('seller');
            setNewPropertyAddress('');
            setNewPropertyCity('');
            setNewPropertyState('');
            setNewPropertyZip('');
            setNewPropertyType('single_family_home');
            setNewPrice('');
            setNewCoverImage('');
            setSelectedNewTransactionListingId(null);
            setSelectedNewTransactionListing(null);
            setOpenNewTransactionModal(false);
            setIsCreatingTransaction(false);

            // Refresh data
            window.location.reload();
        } catch (error: any) {
            console.error('Error creating transaction:', error);
            alert(`Failed to create transaction: ${error.message || 'Unknown error'}`);
            setIsCreatingTransaction(false);
        }
    };

    const handlePreviewDocument = async (doc: any) => {
        try {
            const { data } = supabase.storage
                .from('documents')
                .getPublicUrl(doc.file_url);

            if (data?.publicUrl) {
                window.open(data.publicUrl, '_blank');
            } else {
                alert('Unable to preview document');
            }
        } catch (error: any) {
            console.error('Error previewing document:', error);
            alert(`Failed to preview document: ${error.message}`);
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
                filePath = `${user.id}/${selectedListing.id}/${Date.now()}.${fileExt}`;

                if (editingDocumentId) {
                    const existingDoc = uploadedDocuments?.find((d: any) => d.id === editingDocumentId);
                    if (existingDoc) {
                        try {
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
                const documentData: any = {
                    transaction_id: selectedListing.id,
                    document_type: documentType,
                    file_name: selectedFile!.name,
                    file_url: filePath,
                    file_size: selectedFile!.size,
                    uploaded_by: user.id,
                };

                if (selectedListing.listing_id) {
                    documentData.listing_id = selectedListing.listing_id;
                }

                const { error: dbError } = await supabase
                    .from('transaction_documents')
                    .insert(documentData);

                if (dbError) throw dbError;
            }

            // queryClient.invalidateQueries({ queryKey: ['transaction', selectedListing.id] }); // Might not need to invalidate entire transaction
            queryClient.invalidateQueries({ queryKey: ['transaction-documents', selectedListing.id] });

            setUploadDialogOpen(false);
            setSelectedFile(null);
            setDocumentType('');
            setEditingDocumentId(null);
        } catch (error: any) {
            console.error('Error uploading document:', error);
            alert(`Failed to ${editingDocumentId ? 'update' : 'upload'} document: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    // Kept from previous implementation but unused in new component usage - kept for safety if needed internally or remove entirely. 
    // Ideally we remove handleViewCommissionStatement if it becomes redundant or adapt it.
    const handleViewCommissionStatement = async (transaction: any) => {
        try {
            // Fetch the commission statement document for this transaction
            const { data: documents, error: fetchError } = await supabase
                .from('transaction_documents')
                .select('*')
                .eq('listing_id', transaction.listing_id || transaction.id)
                .eq('document_type', 'Commission Statement')
                .order('uploaded_at', { ascending: false })
                .limit(1);

            if (fetchError) throw fetchError;

            if (!documents || documents.length === 0) {
                alert('No commission statement found for this transaction.');
                return;
            }

            const commissionDoc = documents[0];

            // Generate a signed URL for the document
            const { data, error } = await supabase.storage
                .from('documents')
                .createSignedUrl(commissionDoc.file_url, 60);

            if (error) throw error;

            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            }
        } catch (err: any) {
            console.error('Error viewing commission statement:', err);
            alert(`Failed to view commission statement: ${err.message}`);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'closed':
                return dashboardStyles.chipSuccess;
            case 'active':
                return dashboardStyles.chipInfo;
            case 'pending':
                return dashboardStyles.chipWarning;
            default:
                return dashboardStyles.chip;
        }
    };

    // Check which required documents have been uploaded
    const getDocumentStatus = () => {
        const uploaded = new Set(uploadedDocuments?.map(doc => doc.document_type) || []);
        return REQUIRED_DOCUMENTS.map(doc => ({
            ...doc,
            uploaded: uploaded.has(doc.id),
        }));
    };

    // For rentals, skip document requirements
    const isRentalTransaction = selectedListing?.listing_type === 'for_rent' || selectedListing?.transaction_type === 'rental';
    const allDocumentsUploaded = isRentalTransaction ? true : getDocumentStatus().every(doc => doc.uploaded);

    return (
        <>

            <Box>
                {/* Header */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                            Close your transactions and manage your deals
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {/* New Listing Button Removed */}
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setOpenNewTransactionModal(true)}
                            sx={dashboardStyles.buttonContained}
                        >
                            New Transaction
                        </Button>
                    </Box>
                </Box>

                {/* Pending Transactions */}
                <Box
                    sx={{
                        maxHeight: '65vh',
                        overflowY: 'auto',
                        pr: 1,
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
                    {pendingTransactions.length > 0 ? (
                        <Box>
                            {pendingTransactions.map((transaction) => (
                                <Card
                                    key={transaction.id}
                                    sx={{
                                        backgroundColor: '#121212',
                                        border: '1px solid #2A2A2A',
                                        borderRadius: '8px',
                                        mb: 1.5,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: { xs: 'column', sm: 'row' },
                                    }}
                                >
                                    {/* Cover Image */}
                                    <Box
                                        sx={{
                                            width: { xs: '100%', sm: 180 },
                                            height: { xs: 140, sm: 'auto' },
                                            minHeight: { sm: 180 },
                                            backgroundColor: '#2A2A2A',
                                            backgroundImage: transaction.cover_image ? `url(${transaction.cover_image})` : 'none',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {!transaction.cover_image && (
                                            <Box sx={{ textAlign: 'center', color: '#4A4A4A' }}>
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                                                </svg>
                                            </Box>
                                        )}
                                    </Box>

                                    <CardContent sx={{ p: 2, flex: 1, minWidth: 0 }}>
                                        {/* Transaction Header */}
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 0.5, fontSize: '1rem', wordBreak: 'break-word' }}>
                                                {transaction.property_address}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                                                <Typography variant="body2" sx={{ color: '#B0B0B0', fontSize: '0.85rem' }}>
                                                    {transaction.property_city}, {transaction.property_state}
                                                </Typography>
                                                <Chip
                                                    label={transaction.transaction_type === 'sale' ? 'Sale' : 'Rental'}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: transaction.transaction_type === 'sale' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                                                        color: transaction.transaction_type === 'sale' ? '#E2C05A' : '#FF9800',
                                                        border: `1px solid ${transaction.transaction_type === 'sale' ? '#E2C05A' : '#FF9800'}`,
                                                    }}
                                                />
                                                <Chip
                                                    label={(transaction.agency_type || 'seller').charAt(0).toUpperCase() + (transaction.agency_type || 'seller').slice(1)}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(196, 157, 47, 0.1)',
                                                        color: '#c49d2f',
                                                        border: '1px solid #c49d2f',
                                                    }}
                                                />
                                                <Typography variant="body2" sx={{ color: '#E2C05A', fontWeight: 600, fontSize: '0.9rem', fontFamily: '"JetBrains Mono", monospace' }}>
                                                    ${(transaction.sale_price || transaction.listing_price || 0).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Action Buttons */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                                            {isMobile ? (
                                                <>
                                                    {/* Mobile: 3-dot menu */}
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleMenuOpen(e, transaction.id)}
                                                        sx={{ color: '#FFFFFF' }}
                                                    >
                                                        <DotsThreeVertical size={20} weight="bold" />
                                                    </IconButton>
                                                    {/* Close Transaction button stays visible on mobile */}
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<CheckCircle />}
                                                        onClick={() => handleOpenCloseModal(transaction)}
                                                        sx={{
                                                            backgroundColor: '#10B981',
                                                            color: '#FFFFFF',
                                                            fontSize: '0.8rem',
                                                            '&:hover': {
                                                                backgroundColor: '#059669',
                                                            },
                                                        }}
                                                    >
                                                        Close Transaction
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Desktop: All buttons visible */}
                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            startIcon={<Description />}
                                                            onClick={() => handleOpenCommissionModal(transaction)}
                                                            sx={{
                                                                borderColor: '#2A2A2A',
                                                                color: '#FFFFFF',
                                                                fontSize: '0.8rem',
                                                                '&:hover': {
                                                                    borderColor: '#E2C05A',
                                                                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                                                },
                                                            }}
                                                        >
                                                            Generate Commission Statement
                                                        </Button>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            onClick={() => router.push(`/transactions/${transaction.id}`)}
                                                            sx={{
                                                                borderColor: '#2A2A2A',
                                                                color: '#FFFFFF',
                                                                fontSize: '0.8rem',
                                                                '&:hover': {
                                                                    borderColor: '#E2C05A',
                                                                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                                                },
                                                            }}
                                                        >
                                                            View Details
                                                        </Button>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            startIcon={<Upload />}
                                                            onClick={() => {
                                                                setSelectedListing(transaction);
                                                                setUploadDialogOpen(true);
                                                            }}
                                                            sx={{
                                                                borderColor: '#2A2A2A',
                                                                color: '#FFFFFF',
                                                                fontSize: '0.8rem',
                                                                '&:hover': {
                                                                    borderColor: '#E2C05A',
                                                                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                                                },
                                                            }}
                                                        >
                                                            Upload/View Documents
                                                        </Button>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            startIcon={<CheckCircle />}
                                                            onClick={() => handleOpenCloseModal(transaction)}
                                                            sx={{
                                                                backgroundColor: '#10B981',
                                                                color: '#FFFFFF',
                                                                fontSize: '0.8rem',
                                                                '&:hover': {
                                                                    backgroundColor: '#059669',
                                                                },
                                                            }}
                                                        >
                                                            Close Transaction
                                                        </Button>
                                                    </Box>
                                                </>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                textAlign: 'center',
                                p: 6,
                                border: '2px dashed #2A2A2A',
                                borderRadius: 1,
                                backgroundColor: '#121212',
                            }}
                        >
                            <Typography variant="h6" sx={{ color: '#B0B0B0', mb: 1 }}>
                                No pending transactions
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#808080' }}>
                                Create a new transaction to get started
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Commission Statement Modal */}
                <CommissionStatementModal
                    open={openCommissionModal}
                    onClose={() => setOpenCommissionModal(false)}
                    transaction={selectedListing}
                    userProfile={userProfile}
                />

                {/* Upload Document Dialog */}
                <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: '#121212', border: '1px solid #2A2A2A' } }}>
                    <DialogTitle sx={{ color: '#FFFFFF' }}>
                        {editingDocumentId ? 'Edit Document' : 'Upload Document'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Document List for Selected Transaction */}
                            {selectedListing && (
                                <Box>
                                    <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>Current Documents</Typography>
                                    <List dense>
                                        {uploadedDocuments?.map((doc: any) => (
                                            <ListItem
                                                key={doc.id}
                                                sx={{
                                                    border: '1px solid #333',
                                                    borderRadius: 1,
                                                    mb: 1,
                                                    backgroundColor: '#1A1A1A'
                                                }}
                                                secondaryAction={
                                                    <Box>
                                                        <IconButton edge="end" aria-label="preview" onClick={() => handlePreviewDocument(doc)} sx={{ color: '#E2C05A' }}>
                                                            <Eye />
                                                        </IconButton>
                                                    </Box>
                                                }
                                            >
                                                <ListItemIcon sx={{ color: '#B0B0B0', minWidth: 40 }}>
                                                    <Description fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={doc.document_type}
                                                    secondary={doc.file_name}
                                                    primaryTypographyProps={{ style: { color: '#FFFFFF' } }}
                                                    secondaryTypographyProps={{ style: { color: '#808080' } }}
                                                />
                                            </ListItem>
                                        ))}
                                        {(!uploadedDocuments || uploadedDocuments.length === 0) && (
                                            <Typography variant="body2" sx={{ color: '#808080', fontStyle: 'italic' }}>
                                                No documents uploaded yet.
                                            </Typography>
                                        )}
                                    </List>
                                </Box>
                            )}

                            <Box sx={{ borderTop: '1px solid #333', pt: 3 }}>
                                <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>Upload New Document</Typography>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: '#808080' }}>Document Type</InputLabel>
                                    <Select
                                        value={documentType}
                                        label="Document Type"
                                        onChange={(e) => setDocumentType(e.target.value)}
                                        sx={{
                                            color: '#FFFFFF',
                                            '.MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#808080' },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E2C05A' },
                                            '.MuiSvgIcon-root': { color: '#808080' },
                                        }}
                                    >
                                        {REQUIRED_DOCUMENTS.map((doc) => (
                                            <MenuItem key={doc.id} value={doc.id}>
                                                {doc.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Box
                                    sx={{
                                        border: '2px dashed #2A2A2A',
                                        borderRadius: 1,
                                        p: 3,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        '&:hover': { borderColor: '#E2C05A', backgroundColor: 'rgba(226, 192, 90, 0.04)' },
                                    }}
                                    onClick={() => document.getElementById('document-upload-input')?.click()}
                                >
                                    <input
                                        type="file"
                                        id="document-upload-input"
                                        hidden
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setSelectedFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                    <Upload sx={{ fontSize: 40, color: '#808080', mb: 1 }} />
                                    <Typography sx={{ color: '#B0B0B0' }}>
                                        {selectedFile ? selectedFile.name : 'Click to upload specific document'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setUploadDialogOpen(false)} sx={{ color: '#808080' }}>Cancel</Button>
                        <Button onClick={handleUploadDocument} variant="contained" disabled={uploading} sx={dashboardStyles.buttonContained}>
                            {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Close Transaction Modal */}
                <Dialog
                    open={openCloseModal}
                    onClose={() => setOpenCloseModal(false)
                    }
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
                        Close Transaction
                    </DialogTitle>
                    <DialogContent>
                        {selectedListing && (
                            <Box sx={{ mt: 2 }}>
                                {/* Property Info */}
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 1 }}>
                                        {selectedListing.property_address}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                                        {selectedListing.property_city}, {selectedListing.property_state}
                                    </Typography>
                                </Box>

                                {/* Required Documents Checklist - Only for Sale transactions */}
                                {!isRentalTransaction && (
                                    <>
                                        <Alert
                                            severity="info"
                                            sx={{
                                                backgroundColor: 'rgba(226, 192, 90, 0.15)',
                                                border: '1px solid rgba(226, 192, 90, 0.3)',
                                                color: '#EDD48A',
                                                mb: 3,
                                                '& .MuiAlert-icon': {
                                                    color: '#EDD48A',
                                                },
                                            }}
                                        >
                                            Please ensure all required documents are uploaded before closing the transaction.
                                        </Alert>

                                        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 2 }}>
                                            Required Documents
                                        </Typography>

                                        <List sx={{ bgcolor: '#0D0D0D', borderRadius: '8px', p: 0 }}>
                                            {getDocumentStatus().map((doc, index) => (
                                                <ListItem
                                                    key={doc.id}
                                                    sx={{
                                                        borderBottom: index < REQUIRED_DOCUMENTS.length - 1 ? '1px solid #2A2A2A' : 'none',
                                                        py: 2,
                                                    }}
                                                >
                                                    <ListItemIcon>
                                                        {doc.uploaded ? (
                                                            <CheckCircle sx={{ color: '#E2C05A' }} />
                                                        ) : (
                                                            <RadioButtonUnchecked sx={{ color: '#4A4A4A' }} />
                                                        )}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <Typography sx={{ color: doc.uploaded ? '#FFFFFF' : '#B0B0B0', fontWeight: doc.uploaded ? 600 : 400 }}>
                                                                {doc.name}
                                                            </Typography>
                                                        }
                                                        secondary={
                                                            <Typography variant="body2" sx={{ color: '#808080', fontSize: '0.85rem' }}>
                                                                {doc.description}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>

                                        {!allDocumentsUploaded && (
                                            <Alert
                                                severity="warning"
                                                sx={{
                                                    backgroundColor: 'rgba(255, 152, 0, 0.15)',
                                                    border: '1px solid rgba(255, 152, 0, 0.3)',
                                                    color: '#FFB74D',
                                                    mt: 3,
                                                    '& .MuiAlert-icon': {
                                                        color: '#FFB74D',
                                                    },
                                                }}
                                            >
                                                You must upload all required documents before closing this transaction.
                                            </Alert>
                                        )}
                                    </>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ padding: '16px 24px' }}>
                        <Button onClick={() => setOpenCloseModal(false)} sx={{ color: '#B0B0B0' }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleCloseTransaction}
                            disabled={!allDocumentsUploaded}
                            sx={{
                                ...dashboardStyles.buttonContained,
                                '&.Mui-disabled': {
                                    backgroundColor: '#2A2A2A',
                                    color: '#4A4A4A',
                                },
                            }}
                        >
                            Close Transaction
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* New Transaction Modal */}
                <Dialog
                    open={openNewTransactionModal}
                    onClose={() => setOpenNewTransactionModal(false)}
                    maxWidth="sm"
                    fullWidth
                    disableEnforceFocus
                    PaperProps={{
                        sx: {
                            backgroundColor: '#121212',
                            border: '1px solid #2A2A2A',
                        },
                    }}
                    BackdropProps={{
                        sx: {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        },
                    }}
                >
                    <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                        New Transaction
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            {/* Listing Selector - Optional */}
                            <Autocomplete
                                options={filteredListings}
                                getOptionLabel={(option) =>
                                    `${option.property_address}, ${option.property_city}, ${option.property_state}`
                                }
                                value={selectedNewTransactionListing}
                                onChange={(_, newValue) => handleListingSelect(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select from Existing Listing (Optional)"
                                        placeholder="Search your listings..."
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {!listings ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                        sx={dashboardStyles.textField}
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.id}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                            <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                                                {option.property_address}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#B0B0B0' }}>
                                                {option.property_city}, {option.property_state} • {option.listing_type === 'for_sale' ? 'Sale' : 'Rental'} • ${option.price?.toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                                sx={{
                                    '& .MuiAutocomplete-popupIndicator': { color: '#B0B0B0' },
                                    '& .MuiAutocomplete-clearIndicator': { color: '#B0B0B0' },
                                }}
                                ListboxProps={{
                                    sx: {
                                        backgroundColor: '#1A1A1A',
                                        border: '1px solid #2A2A2A',
                                        '& .MuiAutocomplete-option': {
                                            '&:hover': {
                                                backgroundColor: '#2A2A2A',
                                            },
                                            '&[aria-selected="true"]': {
                                                backgroundColor: '#333333',
                                            },
                                        },
                                    },
                                }}
                            />

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: '#B0B0B0' }}>Transaction Type *</InputLabel>
                                    <Select
                                        value={newTransactionType}
                                        label="Transaction Type *"
                                        onChange={(e) => {
                                            const type = e.target.value as 'sale' | 'rental';
                                            setNewTransactionType(type);
                                            // Reset agency type to default for new transaction type
                                            setNewAgencyType(type === 'sale' ? 'seller' : 'tenant');
                                        }}
                                        sx={dashboardStyles.textField}
                                        MenuProps={{
                                            disablePortal: false,
                                            PaperProps: {
                                                sx: {
                                                    backgroundColor: '#1A1A1A',
                                                    border: '1px solid #2A2A2A',
                                                    '& .MuiMenuItem-root': {
                                                        color: '#FFFFFF',
                                                        '&:hover': {
                                                            backgroundColor: '#2A2A2A',
                                                        },
                                                        '&.Mui-selected': {
                                                            backgroundColor: '#333333',
                                                            '&:hover': {
                                                                backgroundColor: '#3A3A3A',
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem value="sale">Sale</MenuItem>
                                        <MenuItem value="rental">Rental</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: '#B0B0B0' }}>Agency *</InputLabel>
                                    <Select
                                        native
                                        value={newAgencyType}
                                        label="Agency *"
                                        onChange={(e) => setNewAgencyType(e.target.value)}
                                        sx={dashboardStyles.textField}
                                    >
                                        {newTransactionType === 'sale' ? (
                                            <>
                                                <option value="seller">Seller</option>
                                                <option value="buyer">Buyer</option>
                                                <option value="dual">Dual</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="tenant">Tenant</option>
                                                <option value="landlord">Landlord</option>
                                                <option value="dual">Dual</option>
                                            </>
                                        )}
                                    </Select>
                                </FormControl>
                            </Box>

                            <FormControl fullWidth>
                                <InputLabel sx={{ color: '#B0B0B0' }}>Property Type *</InputLabel>
                                <Select
                                    value={newPropertyType}
                                    label="Property Type *"
                                    onChange={(e) => setNewPropertyType(e.target.value)}
                                    sx={dashboardStyles.textField}
                                    MenuProps={{
                                        disablePortal: false,
                                        PaperProps: {
                                            sx: {
                                                backgroundColor: '#1A1A1A',
                                                border: '1px solid #2A2A2A',
                                                '& .MuiMenuItem-root': {
                                                    color: '#FFFFFF',
                                                    '&:hover': {
                                                        backgroundColor: '#2A2A2A',
                                                    },
                                                    '&.Mui-selected': {
                                                        backgroundColor: '#333333',
                                                        '&:hover': {
                                                            backgroundColor: '#3A3A3A',
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    }}
                                >
                                    <MenuItem value="single_family_home">Single Family Home</MenuItem>
                                    <MenuItem value="apartment">Apartment</MenuItem>
                                    <MenuItem value="condo">Condo</MenuItem>
                                    <MenuItem value="villa">Villa</MenuItem>
                                    <MenuItem value="office">Office</MenuItem>
                                    <MenuItem value="shop">Shop</MenuItem>
                                    <MenuItem value="studio">Studio</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                label="Property Address *"
                                value={newPropertyAddress}
                                onChange={(e) => setNewPropertyAddress(e.target.value)}
                                fullWidth
                                sx={dashboardStyles.textField}
                                placeholder="123 Main St"
                            />

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                                <TextField
                                    label="City *"
                                    value={newPropertyCity}
                                    onChange={(e) => setNewPropertyCity(e.target.value)}
                                    fullWidth
                                    sx={dashboardStyles.textField}
                                    placeholder="Atlanta"
                                />

                                <TextField
                                    label="State *"
                                    value={newPropertyState}
                                    onChange={(e) => setNewPropertyState(e.target.value)}
                                    fullWidth
                                    sx={dashboardStyles.textField}
                                    placeholder="GA"
                                />

                                <TextField
                                    label="ZIP Code *"
                                    value={newPropertyZip}
                                    onChange={(e) => setNewPropertyZip(e.target.value)}
                                    fullWidth
                                    sx={dashboardStyles.textField}
                                    placeholder="30301"
                                />
                            </Box>

                            <TextField
                                label={newTransactionType === 'sale' ? 'Listing Price *' : 'Rental Price *'}
                                value={newPrice ? `$${parseFloat(newPrice).toLocaleString()}` : ''}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9.]/g, '');
                                    setNewPrice(value);
                                }}
                                fullWidth
                                sx={dashboardStyles.textField}
                                placeholder="$0"
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ padding: '16px 24px' }}>
                        <Button onClick={() => setOpenNewTransactionModal(false)} sx={{ color: '#B0B0B0' }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleCreateNewTransaction}
                            sx={dashboardStyles.buttonContained}
                            disabled={!newPropertyAddress || !newPropertyCity || !newPropertyState || !newPropertyZip || !newPrice || isCreatingTransaction}
                        >
                            {isCreatingTransaction ? 'Creating...' : 'Create Transaction'}
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
                            minWidth: 220,
                        },
                    }}
                >
                    <MenuItem
                        onClick={() => {
                            const transaction = pendingTransactions.find(t => t.id === selectedTransactionId);
                            if (transaction) handleOpenCommissionModal(transaction);
                            handleMenuClose();
                        }}
                        sx={{
                            color: '#FFFFFF',
                            '&:hover': { backgroundColor: '#2A2A2A' },
                            py: 1.5,
                        }}
                    >
                        <Description sx={{ mr: 1.5, fontSize: 20 }} />
                        Generate Commission Statement
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            if (selectedTransactionId) router.push(`/transactions/${selectedTransactionId}`);
                            handleMenuClose();
                        }}
                        sx={{
                            color: '#FFFFFF',
                            '&:hover': { backgroundColor: '#2A2A2A' },
                            py: 1.5,
                        }}
                    >
                        <Eye size={20} style={{ marginRight: 12 }} />
                        View Details
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            const transaction = pendingTransactions.find(t => t.id === selectedTransactionId);
                            if (transaction) {
                                setSelectedListing(transaction);
                                setUploadDialogOpen(true);
                            }
                            handleMenuClose();
                        }}
                        sx={{
                            color: '#FFFFFF',
                            '&:hover': { backgroundColor: '#2A2A2A' },
                            py: 1.5,
                        }}
                    >
                        <Upload sx={{ mr: 1.5, fontSize: 20 }} />
                        Upload/View Documents
                    </MenuItem>
                </Menu>
            </Box >
        </>
    );

}
