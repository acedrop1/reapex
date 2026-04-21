'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Typography,
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  clientSecret: string;
  priceId: string;
  productId: string;
  planId: string;
  planName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ priceId, productId, planId, planName, onSuccess, onCancel }: Omit<PaymentFormProps, 'clientSecret'>) {
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
      // Confirm setup
      const { error: setupError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
      });

      if (setupError) {
        setError(setupError.message || 'An error occurred');
        setProcessing(false);
        return;
      }

      if (!setupIntent?.payment_method) {
        setError('No payment method found');
        setProcessing(false);
        return;
      }

      // Create subscription with saved payment method
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          productId,
          paymentMethodId: setupIntent.payment_method,
          planId,
          planName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Success!
      onSuccess();
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred');
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

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={onCancel}
          disabled={processing}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={!stripe || processing}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {processing ? <CircularProgress size={24} /> : 'Subscribe'}
        </Button>
      </Box>
    </form>
  );
}

export default function StripePaymentForm({
  clientSecret,
  priceId,
  productId,
  planId,
  planName,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#E2C05A',
        colorBackground: '#121212',
        colorText: '#FFFFFF',
        colorDanger: '#EF5350',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 3, color: '#B0B0B0' }}>
        Enter your payment details below. Your card will be saved for future payments.
      </Typography>

      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm
          priceId={priceId}
          productId={productId}
          planId={planId}
          planName={planName}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </Elements>
    </Box>
  );
}
