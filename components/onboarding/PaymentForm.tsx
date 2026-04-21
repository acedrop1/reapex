'use client';

import { useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';

interface PaymentFormProps {
    onSuccess: (paymentMethodId: string) => void;
    onCancel?: () => void;
}

export default function PaymentForm({ onSuccess, onCancel }: PaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            // Confirm the SetupIntent
            // We use redirect: 'if_required' to avoid page reloads if not needed
            const { error: setupError, setupIntent } = await stripe.confirmSetup({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/dashboard`, // Fallback return URL
                },
                redirect: 'if_required',
            });

            if (setupError) {
                setError(setupError.message || 'An error occurred during setup.');
                setProcessing(false);
                return;
            }

            if (setupIntent && setupIntent.status === 'succeeded') {
                const paymentMethodId = typeof setupIntent.payment_method === 'string'
                    ? setupIntent.payment_method
                    : setupIntent.payment_method?.id;

                if (paymentMethodId) {
                    onSuccess(paymentMethodId);
                } else {
                    setError('Failed to retrieve payment method ID.');
                }
            } else {
                // Handle other statuses like 'processing', 'requires_action' (though 'if_required' handles most)
                setError(`Setup incomplete. Status: ${setupIntent?.status}`);
            }

        } catch (err: any) {
            console.error('Payment setup error:', err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
                <PaymentElement
                    options={{
                        layout: 'tabs',
                    }}
                />
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                {onCancel && (
                    <Button
                        variant="outlined"
                        onClick={onCancel}
                        disabled={processing}
                        sx={{ textTransform: 'none', borderRadius: '8px' }}
                    >
                        Back
                    </Button>
                )}
                <Button
                    type="submit"
                    variant="contained"
                    disabled={!stripe || processing}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '8px',
                        px: 4,
                        py: 1.5,
                        backgroundColor: '#E2C05A',
                        '&:hover': {
                            backgroundColor: '#C4A43B',
                        }
                    }}
                >
                    {processing ? <CircularProgress size={24} color="inherit" /> : 'Verify Card Information'}
                </Button>
            </Box>
        </form>
    );
}
