'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import { Check as CheckIcon, X } from '@phosphor-icons/react';
import StripePaymentForm from '@/components/stripe/StripePaymentForm';

interface Plan {
  id: string;
  name: string;
  productId: string;
  priceId: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

const plans: Plan[] = [
  {
    id: 'launch',
    name: 'Reapex Launch',
    productId: 'prod_TWNzj9R1fsELnE',
    priceId: 'price_1SZLDsLJ58SkLqL0LbEF7pAO',
    price: 0,
    features: [
      '80/20 Commission Split',
      '$18,000 Annual Commission Cap',
    ],
  },
  {
    id: 'growth',
    name: 'Reapex Growth',
    productId: 'prod_TWO0eJAXu13836',
    priceId: 'price_1SZLEOLJ58SkLqL0inV4Ecpa',
    price: 225,
    features: [
      '90/10 Commission Split',
      '$12,000 Annual Commission Cap',
    ],
  },
  {
    id: 'pro',
    name: 'Reapex Pro',
    productId: 'prod_TWO0k1liPxisfq',
    priceId: 'price_1SZLEgLJ58SkLqL0BtiTzn4J',
    price: 550,
    features: [
      '100% Commission (No Split)',
      'No Commission Cap',
    ],
  },
];

interface CommissionPlanSelectorProps {
  currentPlan?: string;
  onSuccess?: () => void;
}

export default function CommissionPlanSelector({ currentPlan, onSuccess }: CommissionPlanSelectorProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const handleSelectPlan = async (plan: Plan) => {
    // For free plans (Launch), update directly without payment
    if (plan.price === 0) {
      try {
        setLoading(plan.id);
        setError(null);

        // Directly update to free plan without payment
        const response = await fetch('/api/stripe/update-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: plan.id,
            planName: plan.name,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update plan');
        }

        // Reload to reflect changes
        window.location.reload();
      } catch (err: any) {
        console.error('Plan selection error:', err);
        setError(err.message || 'Failed to process plan selection');
      } finally {
        setLoading(null);
      }
      return;
    }

    // For paid plans, create SetupIntent and show payment dialog
    if (!plan.priceId) {
      setError('This plan is not yet configured. Please contact support.');
      return;
    }

    try {
      setLoading(plan.id);
      setError(null);

      // Create SetupIntent for card on file
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create setup intent');
      }

      // Open payment dialog with client secret
      setClientSecret(data.clientSecret);
      setSelectedPlan(plan);
      setPaymentDialog(true);
    } catch (err: any) {
      console.error('Plan selection error:', err);
      setError(err.message || 'Failed to process plan selection');
    } finally {
      setLoading(null);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentDialog(false);
    setClientSecret(null);
    setSelectedPlan(null);
    window.location.reload();
  };

  const handlePaymentCancel = () => {
    setPaymentDialog(false);
    setClientSecret(null);
    setSelectedPlan(null);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.name;
          const isLoading = loading === plan.id;

          return (
            <Grid item xs={12} key={plan.id}>
              <Card
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'stretch', md: 'center' },
                  position: 'relative',
                  border: plan.recommended ? '2px solid #E2C05A' : '1px solid #2A2A2A',
                  backgroundColor: '#121212',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#E2C05A',
                    boxShadow: '0 4px 12px rgba(226, 192, 90, 0.15)',
                  },
                }}
              >
                {plan.recommended && (
                  <Chip
                    label="RECOMMENDED"
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      fontWeight: 600,
                    }}
                  />
                )}

                <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, gap: 3, p: 3, width: '100%' }}>
                  {/* Plan Name & Price */}
                  <Box sx={{ minWidth: { xs: '100%', md: '200px' } }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#FFFFFF' }}>
                      {plan.name}
                    </Typography>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
                        {plan.price === 0 ? 'Free' : `$${plan.price}`}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                        {plan.price === 0 ? 'Forever' : 'per month'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Features */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {plan.features.map((feature, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: { xs: '100%', md: 'auto' } }}>
                          <CheckIcon size={16} color="#E2C05A" weight="bold" />
                          <Typography variant="body2" sx={{ color: '#E0E0E0', fontSize: '0.875rem' }}>
                            {feature}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Action Button */}
                  <Box sx={{ minWidth: { xs: '100%', md: '180px' }, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      fullWidth
                      variant={plan.recommended ? 'contained' : 'outlined'}
                      size="large"
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isCurrentPlan || isLoading}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5,
                      }}
                    >
                      {isLoading ? (
                        <CircularProgress size={24} />
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : (
                        'Select Plan'
                      )}
                    </Button>

                    {isCurrentPlan && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          textAlign: 'center',
                          color: '#E2C05A',
                          fontWeight: 600,
                        }}
                      >
                        ✓ Active
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Promo Code */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ maxWidth: 400, width: '100%' }}>
          <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 1, textAlign: 'center' }}>
            Have a promo code?
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <input
              type="text"
              placeholder="Enter promo code"
              id="promo-code-input"
              style={{
                flex: 1,
                padding: '10px 14px',
                backgroundColor: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#808080', display: 'block', mt: 0.5, textAlign: 'center' }}>
            Promo rates available during Phase 1 of launch
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography
          variant="body2"
          sx={{
            color: '#B0B0B0',
            mb: 1,
          }}
        >
          You can change your plan within 30 days from your employment start date.
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#B0B0B0',
            fontSize: '0.875rem',
          }}
        >
          * Zero transaction fees for all active agents. No junk fees.
        </Typography>
      </Box>

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialog}
        onClose={handlePaymentCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#121212',
            border: '1px solid #3A3A3A',
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
              Complete Your Subscription
            </Typography>
            <IconButton onClick={handlePaymentCancel} size="small" sx={{ color: '#B0B0B0' }}>
              <X size={20} />
            </IconButton>
          </Box>
          {selectedPlan && (
            <Typography variant="body2" sx={{ color: '#B0B0B0', mt: 1 }}>
              {selectedPlan.name} - ${selectedPlan.price}/month
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          {clientSecret && selectedPlan && (
            <StripePaymentForm
              clientSecret={clientSecret}
              priceId={selectedPlan.priceId}
              productId={selectedPlan.productId}
              planId={selectedPlan.id}
              planName={selectedPlan.name}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
