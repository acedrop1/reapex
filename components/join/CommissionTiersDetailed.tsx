'use client';

import { Box, Container, Typography, Grid, Paper, Button, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { Check } from '@phosphor-icons/react';

const tiers = [
  {
    name: 'Launch',
    split: '80/20',
    splitDescription: '80% to you, 20% to brokerage',
    monthlyFee: '$0',
    annualCap: '$18,000',
    badge: 'Start Here',
    badgeColor: '#16a34a',
    recommended: false,
    features: [
      'Reapex Team Platform',
      'Lead-Gen Accelerator',
      'Custom Agent Website',
      'Marketing Autopilot',
      'Direct Broker Access',
      'All-in-One CRM',
      'Transaction Management',
      'E&O Insurance Included',
    ],
  },
  {
    name: 'Growth',
    split: '90/10',
    splitDescription: '90% to you, 10% to brokerage',
    monthlyFee: '$225',
    annualCap: '$12,000',
    badge: 'Popular',
    badgeColor: '#16a34a',
    recommended: false,
    features: [
      'Reapex Team Platform',
      'Lead-Gen Accelerator',
      'Custom Agent Website',
      'Marketing Autopilot',
      'Direct Broker Access',
      'All-in-One CRM',
      'Transaction Management',
      'E&O Insurance Included',
    ],
  },
  {
    name: 'Pro',
    split: '100%',
    splitDescription: '100% to you, unlimited earning potential',
    monthlyFee: '$550',
    annualCap: 'No Cap',
    badge: 'Most Popular',
    badgeColor: '#d4af37',
    recommended: true,
    features: [
      'Reapex Team Platform',
      'Lead-Gen Accelerator',
      'Custom Agent Website',
      'Marketing Autopilot',
      'Direct Broker Access',
      'All-in-One CRM',
      'Transaction Management',
      'E&O Insurance Included',
    ],
  },
];

export default function CommissionTiersDetailed() {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: '#141414',
      }}
    >
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              color: '#ffffff',
              textAlign: 'center',
              mb: 2,
            }}
          >
            Commission Menu
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#999999',
              textAlign: 'center',
              mb: 6,
              maxWidth: '800px',
              mx: 'auto',
            }}
          >
            Flexible Plans. Full Power. Choose the plan that fits your business goals. All plans include full access to the Reapex Operating Platform.
          </Typography>
        </motion.div>

        <Grid container spacing={4} justifyContent="center">
          {tiers.map((tier, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                style={{ height: '100%' }}
              >
                <Paper
                  elevation={tier.recommended ? 8 : 0}
                  sx={{
                    p: 4,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: tier.recommended ? '#1a1a1a' : '#0a0a0a',
                    border: tier.recommended
                      ? '2px solid #d4af37'
                      : '1px solid #2a2a2a',
                    borderRadius: 2,
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: tier.recommended
                        ? '0 12px 32px rgba(212, 175, 55, 0.3)'
                        : '0 8px 24px rgba(212, 175, 55, 0.1)',
                    },
                  }}
                >
                  {/* Badge - Only show for Pro tier */}
                  {tier.recommended && (
                    <Chip
                      label={tier.badge}
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        backgroundColor: tier.badgeColor,
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  )}

                  {/* Tier Name */}
                  <Typography
                    variant="h4"
                    sx={{
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      mb: 1,
                      mt: 2,
                            }}
                  >
                    {tier.name}
                  </Typography>

                  {/* Commission Split */}
                  <Typography
                    variant="h3"
                    sx={{
                      fontSize: '3rem',
                      fontWeight: 700,
                      color: '#d4af37',
                      mb: 1,
                            }}
                  >
                    {tier.split}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#999999',
                      mb: 3,
                    }}
                  >
                    {tier.splitDescription}
                  </Typography>

                  {/* Pricing Details */}
                  <Box sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: '#cccccc', fontWeight: 500 }}
                      >
                        Monthly Fee
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: '#ffffff', fontWeight: 600 }}
                      >
                        {tier.monthlyFee}
                        <span style={{ color: '#666666', fontSize: '0.875rem' }}>
                          /month
                        </span>
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: '#cccccc', fontWeight: 500 }}
                      >
                        Annual Cap
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: '#ffffff', fontWeight: 600 }}
                      >
                        {tier.annualCap}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Features List */}
                  <Box sx={{ mb: 4, flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#cccccc',
                        fontWeight: 600,
                        mb: 2,
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: 1,
                      }}
                    >
                      Included Features
                    </Typography>
                    {tier.features.map((feature, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 1.5,
                        }}
                      >
                        <Check
                          size={20}
                          weight="bold"
                          color="#16a34a"
                          style={{ marginRight: 12, flexShrink: 0 }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ color: '#999999', fontSize: '0.875rem' }}
                        >
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
