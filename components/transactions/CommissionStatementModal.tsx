'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    TextField,
    Slider,
    Grid,
    Button,
    IconButton,
    InputAdornment,
} from '@mui/material';
import { Add, Delete, Close } from '@mui/icons-material';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import { generateCommissionStatement } from '@/lib/utils/pdfGenerator';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface Fee {
    type: string;
    amount: number;
}

interface CommissionStatementModalProps {
    open: boolean;
    onClose: () => void;
    transaction: any;
    userProfile?: any;
}

export default function CommissionStatementModal({
    open,
    onClose,
    transaction,
    userProfile,
}: CommissionStatementModalProps) {
    const supabase = createClient();
    const queryClient = useQueryClient();

    // Detect transaction type for conditional rendering
    const isRental = transaction?.transaction_type === 'rental';

    const [listingPrice, setListingPrice] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [buyerName, setBuyerName] = useState('');
    const [sellerName, setSellerName] = useState('');
    const [commission, setCommission] = useState('');
    const [commissionRate, setCommissionRate] = useState(3.0);
    const [useSlider, setUseSlider] = useState(true); // Default to slider mode as it seems preferred
    const [fees, setFees] = useState<Fee[]>([]);
    const [uploading, setUploading] = useState(false);

    // Initialize form data when transaction changes or modal opens
    useEffect(() => {
        if (open && transaction) {
            setListingPrice((transaction.listing_price || transaction.sale_price || 0).toString());
            setPurchasePrice((transaction.sale_price || '').toString());
            setBuyerName(''); // Could be fetched from contacts if available
            setSellerName('');
            setFees([]);
            setCommissionRate(3.0);
            // Force manual entry for rental transactions
            setUseSlider(transaction.transaction_type !== 'rental');
        }
    }, [open, transaction]);

    useEffect(() => {
        if (useSlider && purchasePrice && transaction?.transaction_type !== 'rental') {
            const price = parseFloat(purchasePrice);
            const calculatedCommission = (price * commissionRate) / 100;
            setCommission(calculatedCommission.toFixed(2));
        }
    }, [useSlider, purchasePrice, commissionRate, transaction?.transaction_type]);

    const handleAddFee = () => {
        setFees([...fees, { type: '', amount: 0 }]);
    };

    const handleRemoveFee = (index: number) => {
        const newFees = [...fees];
        newFees.splice(index, 1);
        setFees(newFees);
    };

    const handleFeeChange = (index: number, field: 'type' | 'amount', value: any) => {
        const newFees = [...fees];
        newFees[index] = { ...newFees[index], [field]: value };
        setFees(newFees);
    };

    const handleGenerateStatement = async () => {
        if (!purchasePrice || !buyerName || !sellerName || !commission) {
            alert('Please fill in all required fields');
            return;
        }

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Use provided userProfile or fetch it if missing
            let agentName = userProfile?.full_name || 'Agent';
            if (!userProfile) {
                const { data: fetchedProfile } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();
                if (fetchedProfile) agentName = fetchedProfile.full_name;
            }

            const commissionData = {
                propertyAddress: transaction.property_address,
                propertyCity: transaction.property_city,
                propertyState: transaction.property_state,
                listingPrice: parseFloat(listingPrice) || 0,
                purchasePrice: parseFloat(purchasePrice),
                commission: parseFloat(commission),
                commissionRate: useSlider ? commissionRate : null,
                buyerName,
                sellerName,
                fees,
                agentName,
                date: new Date().toLocaleDateString(),
            };

            // Generate the PDF
            const { blob, fileName } = await generateCommissionStatement(commissionData);

            // Upload PDF to Supabase Storage
            const storagePath = `${user.id}/${transaction.id}/${Date.now()}_${fileName}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('documents')
                .upload(storagePath, blob, {
                    contentType: 'application/pdf',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Save document metadata to database
            const { error: dbError } = await supabase
                .from('transaction_documents')
                .insert({
                    transaction_id: transaction.id,
                    document_type: 'Commission Statement',
                    file_name: fileName,
                    file_url: uploadData.path,
                    file_size: blob.size,
                    uploaded_by: user.id,
                });

            if (dbError) throw dbError;

            queryClient.invalidateQueries({ queryKey: ['documents', transaction.id] });
            queryClient.invalidateQueries({ queryKey: ['transaction-documents', transaction.id] });

            alert('Commission statement generated and attached to transaction!');
            onClose();
        } catch (error: any) {
            console.error('Error generating commission statement:', error);
            alert(`Failed to generate statement: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    if (!transaction) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: '#121212',
                    border: '1px solid #2A2A2A',
                },
            }}
        >
            <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Generate Commission Statement
                <IconButton onClick={onClose} sx={{ color: '#808080' }}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                    {/* Property Details */}
                    <Box>
                        <Typography variant="caption" sx={{ color: '#B0B0B0', mb: 1, display: 'block' }}>
                            Property Address
                        </Typography>
                        <Typography sx={{ color: '#FFFFFF', fontSize: '16px' }}>
                            {transaction.property_address}, {transaction.property_city},{' '}
                            {transaction.property_state}
                        </Typography>
                    </Box>

                    {/* Listing Price */}
                    <TextField
                        label="Listing Price *"
                        value={listingPrice ? `$${parseFloat(listingPrice).toLocaleString()}` : ''}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            setListingPrice(value);
                        }}
                        fullWidth
                        sx={dashboardStyles.textField}
                        placeholder="$0"
                    />

                    {/* Purchase Price / Rental Price */}
                    <TextField
                        label={isRental ? "Rental Price *" : "Closing Price *"}
                        value={purchasePrice ? `$${parseFloat(purchasePrice).toLocaleString()}` : ''}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            setPurchasePrice(value);
                        }}
                        fullWidth
                        sx={dashboardStyles.textField}
                        placeholder="$0"
                    />

                    {/* Buyer Name / Tenant Name */}
                    <TextField
                        label={isRental ? "Tenant Name *" : "Buyer Name *"}
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        fullWidth
                        sx={dashboardStyles.textField}
                        helperText="Can be submitted from CRM"
                    />

                    {/* Seller Name / Landlord Name */}
                    <TextField
                        label={isRental ? "Landlord Name *" : "Seller Name *"}
                        value={sellerName}
                        onChange={(e) => setSellerName(e.target.value)}
                        fullWidth
                        sx={dashboardStyles.textField}
                        helperText="Can be submitted from CRM"
                    />

                    {/* Commission Calculation Mode - Only show for Sales, not Rentals */}
                    {!isRental && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 1 }}>
                                Calculation Mode
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant={useSlider ? 'contained' : 'outlined'}
                                    onClick={() => setUseSlider(true)}
                                    sx={useSlider ? dashboardStyles.buttonContained : {
                                        borderColor: '#2A2A2A',
                                        color: '#B0B0B0',
                                        '&:hover': { borderColor: '#333333', backgroundColor: '#1A1A1A' }
                                    }}
                                >
                                    Auto-Calculate
                                </Button>
                                <Button
                                    variant={!useSlider ? 'contained' : 'outlined'}
                                    onClick={() => setUseSlider(false)}
                                    sx={!useSlider ? dashboardStyles.buttonContained : {
                                        borderColor: '#2A2A2A',
                                        color: '#B0B0B0',
                                        '&:hover': { borderColor: '#333333', backgroundColor: '#1A1A1A' }
                                    }}
                                >
                                    Manual Entry
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {/* Commission Slider (Only in Auto Mode and for Sales) */}
                    {!isRental && useSlider && (
                        <Box>
                            <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 2 }}>
                                Commission Rate: {commissionRate}%
                            </Typography>
                            <Slider
                                value={commissionRate}
                                onChange={(_, value) => setCommissionRate(value as number)}
                                min={0}
                                max={10}
                                step={0.5}
                                valueLabelDisplay="auto"
                                sx={{
                                    color: '#E2C05A',
                                    '& .MuiSlider-rail': { backgroundColor: '#2A2A2A' },
                                    '& .MuiSlider-mark': { backgroundColor: '#808080' },
                                    '& .MuiSlider-markLabel': { color: '#808080' },
                                }}
                                marks={[
                                    { value: 0, label: '0%' },
                                    { value: 5, label: '5%' },
                                    { value: 10, label: '10%' },
                                ]}
                            />
                        </Box>
                    )}

                    <TextField
                        label="Commission Amount *"
                        value={commission}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            setCommission(value);
                            // If typing manually, ensure we are in manual mode or just allow override?
                            // User request: "it either has to be maual or calculate"
                            if (useSlider) {
                                setUseSlider(false);
                            }
                        }}
                        fullWidth
                        sx={dashboardStyles.textField}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            readOnly: useSlider, // Lock input if in Auto mode to enforce slider usage? Or allow override?
                            // Current logic: typing switches to manual. Let's keep that but maybe make it readOnly if useSlider is true to be strict, as requested.
                        }}
                        helperText={
                            isRental
                                ? "Enter flat commission amount (e.g., one month's rent)"
                                : (useSlider ? "Switch to Manual Entry to edit directly" : "Enter commission amount or use slider")
                        }
                    />

                    {/* Additional Fees */}
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ color: '#FFFFFF' }}>Additional Fees</Typography>
                            <Button
                                startIcon={<Add />}
                                onClick={handleAddFee}
                                sx={{ color: '#E2C05A' }}
                            >
                                Add Fee
                            </Button>
                        </Box>
                        {fees.map((fee, index) => (
                            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Fee Type"
                                        value={fee.type}
                                        onChange={(e) => handleFeeChange(index, 'type', e.target.value)}
                                        fullWidth
                                        sx={dashboardStyles.textField}
                                    />
                                </Grid>
                                <Grid item xs={5}>
                                    <TextField
                                        label="Amount"
                                        type="number"
                                        value={fee.amount}
                                        onChange={(e) => handleFeeChange(index, 'amount', parseFloat(e.target.value))}
                                        fullWidth
                                        sx={dashboardStyles.textField}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={1} sx={{ display: 'flex', alignItems: 'center' }}>
                                    <IconButton onClick={() => handleRemoveFee(index)} sx={{ color: '#EF4444' }}>
                                        <Delete />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        ))}
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid #2A2A2A' }}>
                <Button onClick={onClose} sx={{ color: '#808080' }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleGenerateStatement}
                    disabled={uploading}
                    sx={dashboardStyles.buttonContained}
                >
                    {uploading ? 'Generating...' : 'Generate & Save PDF'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
