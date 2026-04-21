'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    Button,
    IconButton,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
} from '@mui/material';
import {
    CreditCard as CreditCardIcon,
    Trash as TrashIcon,
    Plus as PlusIcon,
    Check as CheckIcon,
} from '@phosphor-icons/react';
import PaymentForm from '../onboarding/PaymentForm';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentMethod {
    id: string;
    card: {
        brand: string;
        last4: string;
        exp_month: number;
        exp_year: number;
    };
}

interface PaymentMethodManagerProps {
    onSelect?: (paymentMethodId: string) => void;
    clientSecret?: string; // For adding new cards
}

export default function PaymentMethodManager({ onSelect, clientSecret }: PaymentMethodManagerProps) {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        fetchPaymentMethods();
    }, [refreshTrigger]);

    const fetchPaymentMethods = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/stripe/payment-methods');
            const data = await res.json();
            if (data.paymentMethods) {
                setPaymentMethods(data.paymentMethods);
                // Auto-select first if none selected
                if (!selectedMethod && data.paymentMethods.length > 0) {
                    handleSelect(data.paymentMethods[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch payment methods', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (id: string) => {
        setSelectedMethod(id);
        if (onSelect) onSelect(id);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to remove this card?')) return;

        try {
            const res = await fetch(`/api/stripe/payment-methods?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRefreshTrigger(prev => prev + 1);
                if (selectedMethod === id) setSelectedMethod(null);
            }
        } catch (error) {
            console.error('Failed to delete payment method', error);
        }
    };

    const handleAddSuccess = () => {
        setAddDialogOpen(false);
        setRefreshTrigger(prev => prev + 1);
    };

    if (loading && paymentMethods.length === 0) {
        return <CircularProgress size={24} />;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                    Saved Payment Methods
                </Typography>
                <Button
                    startIcon={<PlusIcon />}
                    size="small"
                    onClick={() => setAddDialogOpen(true)}
                    sx={{ textTransform: 'none' }}
                >
                    Add New
                </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {paymentMethods.map((pm) => (
                    <Card
                        key={pm.id}
                        onClick={() => handleSelect(pm.id)}
                        sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            backgroundColor: selectedMethod === pm.id ? 'rgba(226, 192, 90, 0.1)' : '#1A1A1A',
                            border: `1px solid ${selectedMethod === pm.id ? '#E2C05A' : '#333'}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: '#E2C05A',
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CreditCardIcon size={32} color={selectedMethod === pm.id ? '#E2C05A' : '#B0B0B0'} />
                            <Box>
                                <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                                    {pm.card.brand.toUpperCase()} •••• {pm.card.last4}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#808080' }}>
                                    Expires {pm.card.exp_month}/{pm.card.exp_year}
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {selectedMethod === pm.id && (
                                <CheckIcon size={20} color="#E2C05A" weight="bold" />
                            )}
                            <IconButton
                                size="small"
                                onClick={(e) => handleDelete(e, pm.id)}
                                sx={{ color: '#EF5350' }}
                            >
                                <TrashIcon size={18} />
                            </IconButton>
                        </Box>
                    </Card>
                ))}

                {paymentMethods.length === 0 && (
                    <Typography variant="body2" sx={{ color: '#808080', textAlign: 'center', py: 2 }}>
                        No saved payment methods. Add one to proceed.
                    </Typography>
                )}
            </Box>

            {/* Add New Card Dialog */}
            <Dialog
                open={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                PaperProps={{
                    sx: {
                        backgroundColor: '#1E1E1E',
                        color: '#FFFFFF',
                        minWidth: '400px'
                    }
                }}
            >
                <DialogTitle>Add New Card</DialogTitle>
                <DialogContent>
                    {clientSecret ? (
                        <Elements stripe={stripePromise} options={{
                            clientSecret,
                            appearance: {
                                theme: 'night',
                                variables: {
                                    colorPrimary: '#E2C05A',
                                    colorBackground: '#1E1E1E',
                                    colorText: '#ffffff',
                                }
                            }
                        }}>
                            <PaymentForm
                                onSuccess={handleAddSuccess}
                                onCancel={() => setAddDialogOpen(false)}
                            />
                        </Elements>
                    ) : (
                        <Typography color="error">
                            Configuration error: Missing Setup Intent.
                        </Typography>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
