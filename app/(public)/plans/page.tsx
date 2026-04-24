import { Box, Container, Typography, Grid, Card, CardContent, Chip, Switch, FormControlLabel } from '@mui/material';
import { Check, Star, Crown, CurrencyDollar } from '@phosphor-icons/react/dist/ssr';
import CommissionMenuCalculator from '@/components/plans/CommissionMenuCalculator';
import SoloTeamToggle from '@/components/plans/SoloTeamToggle';

export const dynamic = 'force-dynamic';

export default function CommissionMenuPage() {
  const plans = [
    {
      name: 'Launch',
      tagline: 'Perfect for getting started',
      split: '80/20',
      cap: '$21,000',
      monthlyFee: '$0',
      features: [
        'Keep 80% of every transaction',
        'Annual cap of $21,000',
        'Zero monthly desk fees',
        'Full tech stack included',
        'Transaction coordinator support',
        'Marketing templates library',
        'CRM access (Follow Up Boss)',
        '24/7 broker support',
      ],
      color: '#999999',
      borderColor: '#666666',
      icon: Star,
      popular: false,
    },
    {
      name: 'Growth',
      tagline: 'Most popular choice',
      split: '90/10',
      cap: '$18,000',
      monthlyFee: '$175',
      features: [
        'Keep 90% of every transaction',
        'Annual cap of $18,000',
        '$175 monthly desk fee',
        'Everything in Launch, plus:',
        'Priority transaction support',
        'Advanced marketing automation',
        'Lead generation credits ($500/mo)',
        'Professional photography discount',
      ],
      color: '#d4af37',
      borderColor: '#d4af37',
      icon: Crown,
      popular: true,
    },
    {
      name: 'Pro',
      tagline: 'For top producers',
      split: '100%',
      cap: 'No Cap',
      monthlyFee: '$450',
      features: [
        'Keep 100% of commission',
        'No annual cap ever',
        '$450 monthly desk fee',
        'Everything in Growth, plus:',
        'Dedicated success manager',
        'Unlimited marketing budget',
        'Premium lead placement',
        'White-glove concierge service',
      ],
      color: '#ffffff',
      borderColor: '#333333',
      icon: CurrencyDollar,
      popular: false,
    },
  ];

  return (
    <Box sx={{ backgroundColor: '#0a0a0a', pt: 12 }}>
      {/* Hero Section */}
      <Container maxWidth="xl" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2.5rem', md: '4rem', lg: '5rem' },
              color: '#ffffff',
              mb: 3,
              lineHeight: 1.1,
            }}
          >
            Choose Your Cap.
            <br />
            <Box component="span" sx={{ color: '#d4af37' }}>
              Control Your Future.
            </Box>
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: '#999999',
              maxWidth: '700px',
              mx: 'auto',
              mb: 6,
              fontWeight: 400,
            }}
          >
            This isn't a pricing page. It's an income menu. Pick the commission structure that matches your ambition.
          </Typography>

          {/* Solo vs Team Toggle */}
          <SoloTeamToggle />
        </Box>

        {/* Plan Cards */}
        <Grid container spacing={4} sx={{ mb: 12 }}>
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    backgroundColor: '#141414',
                    border: `2px solid ${plan.borderColor}`,
                    borderRadius: 3,
                    height: '100%',
                    position: 'relative',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-12px)',
                      boxShadow: `0 16px 48px ${plan.color}40`,
                      borderColor: plan.color,
                    },
                  }}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <Chip
                      label="Most Popular"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#d4af37',
                        color: '#0a0a0a',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                                  px: 2,
                      }}
                    />
                  )}

                  <CardContent sx={{ p: 4 }}>
                    {/* Icon */}
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                      <Icon size={48} weight="duotone" color={plan.color} />
                    </Box>

                    {/* Plan Name */}
                    <Typography
                      variant="h4"
                      sx={{
                                  fontWeight: 700,
                        color: '#ffffff',
                        textAlign: 'center',
                        mb: 1,
                      }}
                    >
                      {plan.name}
                    </Typography>

                    {/* Tagline */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666666',
                        textAlign: 'center',
                        mb: 4,
                                }}
                    >
                      {plan.tagline}
                    </Typography>

                    {/* Split Display */}
                    <Box
                      sx={{
                        textAlign: 'center',
                        mb: 4,
                        p: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 2,
                        border: `1px solid ${plan.color}30`,
                      }}
                    >
                      <Typography
                        variant="h2"
                        sx={{
                                      fontWeight: 800,
                          color: plan.color,
                          mb: 1,
                        }}
                      >
                        {plan.split}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#999999',
                                    }}
                      >
                        Commission Split
                      </Typography>
                    </Box>

                    {/* Cap & Fees */}
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography
                            variant="h6"
                            sx={{
                              color: '#ffffff',
                              fontWeight: 700,
                                            }}
                          >
                            {plan.cap}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#666666' }}>
                            Annual Cap
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography
                            variant="h6"
                            sx={{
                              color: '#ffffff',
                              fontWeight: 700,
                                            }}
                          >
                            {plan.monthlyFee}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#666666' }}>
                            Monthly Fee
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Features List */}
                    <Box sx={{ mb: 4 }}>
                      {plan.features.map((feature, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 2,
                            mb: 2,
                          }}
                        >
                          <Check size={20} weight="bold" color={plan.color} style={{ marginTop: '2px', flexShrink: 0 }} />
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#cccccc',
                                              lineHeight: 1.6,
                            }}
                          >
                            {feature}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    {/* CTA Button */}
                    <Box
                      component="a"
                      href="/join"
                      sx={{
                        display: 'block',
                        textAlign: 'center',
                        py: 2,
                        px: 4,
                        backgroundColor: plan.popular ? '#d4af37' : 'transparent',
                        border: plan.popular ? 'none' : `2px solid ${plan.borderColor}`,
                        borderRadius: 2,
                        color: plan.popular ? '#0a0a0a' : '#ffffff',
                        fontWeight: 700,
                        fontSize: '1rem',
                                  textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: plan.popular ? '#c49d2f' : plan.color,
                          color: '#0a0a0a',
                          transform: 'scale(1.02)',
                        },
                      }}
                    >
                      Get Started
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Add-Ons Section */}
        <Box sx={{ mb: 12 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '3rem' },
              color: '#ffffff',
              textAlign: 'center',
              mb: 2,
            }}
          >
            Add-Ons & Team Solutions
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#999999',
              textAlign: 'center',
              maxWidth: '700px',
              mx: 'auto',
              mb: 6,
            }}
          >
            Enhance your plan or scale your business with our flexible add-ons
          </Typography>

          <Grid container spacing={4}>
            {/* Accelerator Plan Add-On */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  backgroundColor: '#141414',
                  border: '2px solid #d4af37',
                  borderRadius: 3,
                  height: '100%',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 16px 48px rgba(212, 175, 55, 0.3)',
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography
                    variant="h4"
                    sx={{
                              fontWeight: 700,
                      color: '#d4af37',
                      mb: 1,
                    }}
                  >
                    Reapex Accelerator
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666666',
                      mb: 3,
                            }}
                  >
                    Optional lead-generation add-on
                  </Typography>

                  <Box
                    sx={{
                      p: 3,
                      backgroundColor: 'rgba(212, 175, 55, 0.1)',
                      borderRadius: 2,
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{
                                  fontWeight: 800,
                        color: '#d4af37',
                        textAlign: 'center',
                        mb: 1,
                      }}
                    >
                      50/50
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#999999',
                        textAlign: 'center',
                                }}
                    >
                      Split on Accelerator Leads
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Check size={20} weight="bold" color="#d4af37" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: '#cccccc', fontFamily: 'DM Sans, sans-serif' }}>
                        Opt in for brokerage-sourced leads
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Check size={20} weight="bold" color="#d4af37" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: '#cccccc', fontFamily: 'DM Sans, sans-serif' }}>
                        50/50 commission split on Accelerator leads
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Check size={20} weight="bold" color="#d4af37" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: '#cccccc', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                        Does not count toward your annual cap
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Business Builders Model */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  backgroundColor: '#141414',
                  border: '2px solid #16a34a',
                  borderRadius: 3,
                  height: '100%',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 16px 48px rgba(22, 163, 74, 0.3)',
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography
                    variant="h4"
                    sx={{
                              fontWeight: 700,
                      color: '#16a34a',
                      mb: 1,
                    }}
                  >
                    Business Builders Model
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666666',
                      mb: 3,
                            }}
                  >
                    Reapex Team Platform
                  </Typography>

                  <Box
                    sx={{
                      p: 3,
                      backgroundColor: 'rgba(22, 163, 74, 0.1)',
                      borderRadius: 2,
                      border: '1px solid rgba(22, 163, 74, 0.3)',
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{
                                  fontWeight: 800,
                        color: '#16a34a',
                        textAlign: 'center',
                        mb: 1,
                      }}
                    >
                      $0/$0
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#999999',
                        textAlign: 'center',
                                }}
                    >
                      Monthly Fee / Transaction Fee
                    </Typography>
                  </Box>

                  <Typography
                    variant="body1"
                    sx={{
                      color: '#cccccc',
                      mb: 3,
                              lineHeight: 1.6,
                    }}
                  >
                    For established Team Leaders, Reapex is a true growth partner. We provide the operational leverage and a revolutionary financial model designed to maximize your profitability, not ours.
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Check size={20} weight="bold" color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: '#cccccc', fontFamily: 'DM Sans, sans-serif' }}>
                        Unlimited agent count under team leader
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Check size={20} weight="bold" color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: '#cccccc', fontFamily: 'DM Sans, sans-serif' }}>
                        $0 monthly fee
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Check size={20} weight="bold" color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: '#cccccc', fontFamily: 'DM Sans, sans-serif' }}>
                        $0 transaction fee
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Expanded Calculator Section */}
        <CommissionMenuCalculator />
      </Container>
    </Box>
  );
}
