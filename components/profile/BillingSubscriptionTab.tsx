'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    Skeleton,
    Alert,
} from '@mui/material';
import {
    CreditCard,
    Crown,
    TrendUp,
    ArrowSquareOut
} from '@phosphor-icons/react';

import PaymentMethodManager from '@/components/stripe/PaymentMethodManager';

interface BillingData {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    paymentMethod: {
        brand: string;
        last4: string;
        exp_month: number;
        exp_year: number;
    } | null;
}

interface BillingSubscriptionTabProps {
    userProfile: any;
}

export default function BillingSubscriptionTab({ userProfile }: BillingSubscriptionTabProps) {
    const [billingLoading, setBillingLoading] = useState(true);
    const [billingData, setBillingData] = useState<BillingData | null>(null);
    const [portalLoading, setPortalLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch billing data
                const billingRes = await fetch('/api/billing');
                if (billingRes.ok) {
                    const data = await billingRes.json();
                    setBillingData(data);
                }

                // Fetch SetupIntent client secret for PaymentMethodManager
                const setupRes = await fetch('/api/stripe/create-setup-intent', { method: 'POST' });
                if (setupRes.ok) {
                    const setupData = await setupRes.json();
                    setClientSecret(setupData.clientSecret);
                }
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setBillingLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleManageBilling = async () => {
        try {
            setPortalLoading(true);
            const res = await fetch('/api/stripe/create-portal-session', {
                method: 'POST',
            });
            const data = await res.json();

            if (res.ok && data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Failed to redirect to billing portal. Please try again.');
            }
        } catch (error: any) {
            console.error('Portal redirect error:', error);
            alert(error.message || 'An error occurred. Please try again.');
        } finally {
            setPortalLoading(false);
        }
    };

    // Plan Details
    const userPlan = userProfile?.subscription_plan || 'launch';
    const planCaps: Record<string, number | null> = {
        launch: 18000,
        growth: 12000,
        pro: null,
    };
    const capAmount = planCaps[userPlan] || userProfile?.cap_amount || 18000;
    const currentProgress = userProfile?.current_cap_progress || 0;
    const capPercentage = capAmount ? Math.min((currentProgress / capAmount) * 100, 100) : 0;

    const getPlanDetails = (plan: string) => {
        switch (plan) {
            case 'pro':
                return { name: 'Reapex Pro', price: '$550/mo', color: '#E2C05A' };
            case 'growth':
                return { name: 'Reapex Growth', price: '$225/mo', color: '#00C853' };
            default:
                return { name: 'Reapex Launch', price: 'Free', color: '#FFB74D' };
        }
    };

    const getProgressColor = (percentage: number) => {
        if (percentage < 50) return '#E2C05A';
        if (percentage < 75) return '#FFB74D';
        return '#EF5350';
    };

    const planInfo = getPlanDetails(userPlan);

    if (billingLoading) {
        return (
            <Box>
                <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2, bgcolor: '#1A1A1A' }} />
                <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2, bgcolor: '#1A1A1A' }} />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Current Plan & Subscription */}
                <Card sx={{ bgcolor: '#121212', border: '1px solid #2A2A2A', borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'rgba(226, 192, 90, 0.1)', color: planInfo.color }}>
                                    <Crown size={24} weight="duotone" />
                                </Box>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                                        {planInfo.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#B0B0B0' }}>
                                        {planInfo.price}
                                    </Typography>
                                </Box>
                            </Box>
                            <Chip
                                label={billingData?.status === 'active' ? 'Active' : 'Inactive'}
                                color={billingData?.status === 'active' ? 'success' : 'default'}
                                size="small"
                                sx={{ borderRadius: 1 }}
                            />
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 0.5 }}>
                                Features
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip label={`${userPlan === 'pro' ? '100%' : userPlan === 'growth' ? '90/10' : '80/20'} Split`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#E0E0E0' }} />
                                <Chip label={userPlan === 'pro' ? 'No Cap' : `$${(capAmount! / 1000)}k Cap`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#E0E0E0' }} />
                            </Box>
                        </Box>

                        {userPlan !== 'pro' ? (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#B0B0B0' }}>Cap Progress</Typography>
                                    <Typography variant="caption" sx={{ color: '#FFFFFF' }}>${(currentProgress / 1000).toFixed(1)}k / ${(capAmount! / 1000).toFixed(0)}k</Typography>
                                </Box>
                                <Box sx={{ position: 'relative', height: 8, bgcolor: '#1A1A1A', borderRadius: 4, overflow: 'hidden' }}>
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            height: '100%',
                                            width: `${capPercentage}%`,
                                            bgcolor: getProgressColor(capPercentage),
                                            borderRadius: 4,
                                        }}
                                    />
                                </Box>
                            </Box>
                        ) : (
                            <Alert severity="success" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#fff', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                You are on the Pro plan with no commission cap!
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Billing Information */}
                <Card sx={{ bgcolor: '#121212', border: '1px solid #2A2A2A', borderRadius: 3 }}>
                    <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>

                        <Box sx={{ flex: 1 }}>
                            <PaymentMethodManager
                                clientSecret={clientSecret}
                            />
                        </Box>

                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<ArrowSquareOut />}
                            onClick={handleManageBilling}
                            disabled={portalLoading}
                            sx={{
                                mt: 3,
                                borderColor: '#333',
                                color: '#E0E0E0',
                                '&:hover': {
                                    borderColor: '#555',
                                    bgcolor: 'rgba(255,255,255,0.05)'
                                }
                            }}
                        >
                            {portalLoading ? 'Loading Portal...' : 'Billing Portal'}
                        </Button>
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: '#666' }}>
                            Download invoices, view history
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}
