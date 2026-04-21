'use client';

import { useState } from 'react';
import { Box, Container, Typography, Grid, Paper, Button, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import AgentApplicationModal from '@/components/modals/AgentApplicationModal';

const tiers = [
  {
    name: 'Launch',
    split: '80/20',
    monthlyFee: '$0',
    annualCap: '$21K Cap',
    description: 'Perfect for new agents getting started',
  },
  {
    name: 'Growth',
    split: '90/10',
    monthlyFee: '$175',
    annualCap: '$18K Cap',
    description: 'Ideal for growing your business',
  },
  {
    name: 'Pro',
    split: '100%',
    monthlyFee: '$450',
    annualCap: 'N/A',
    badge: 'Most Popular',
    badgeColor: '#d4af37',
    description: 'Maximum earnings for top producers',
    recommended: true,
  },
];

export default function CommissionTiersSummary() {
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);

  return (
    <Box
      id="commission-menu"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: '#1a1a1a',
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
              maxWidth: '700px',
              mx: 'auto',
            }}
          >
            Simple, transparent pricing that grows with your business
          </Typography>
        </motion.div>

        <Grid container spacing={4} justifyContent="center">
          {tiers.map((tier, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                style={{ height: '100%' }}
              >
                <Paper
                  elevation={tier.recommended ? 4 : 0}
                  sx={{
                    p: 4,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#0a0a0a',
                    border: tier.recommended
                      ? '2px solid #d4af37'
                      : '1px solid #2a2a2a',
                    borderRadius: 2,
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#d4af37',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(212, 175, 55, 0.15)',
                    },
                  }}
                >
                  {/* Badge */}
                  {tier.badge && (
                    <Chip
                      label={tier.badge}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        backgroundColor: tier.badgeColor,
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    />
                  )}

                  {/* Tier Name */}
                  <Typography
                    variant="h5"
                    sx={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      mb: 1,
                      mt: 1,
                            }}
                  >
                    {tier.name}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#999999',
                      mb: 3,
                      minHeight: '40px',
                    }}
                  >
                    {tier.description}
                  </Typography>

                  {/* Commission Split - Larger */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontSize: '3rem',
                        fontWeight: 700,
                        color: '#d4af37',
                        lineHeight: 1,
                                }}
                    >
                      {tier.split}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#666666',
                        fontSize: '0.875rem',
                      }}
                    >
                      Commission Split
                    </Typography>
                  </Box>

                  {/* Pricing Quick View */}
                  <Box
                    sx={{
                      backgroundColor: '#141414',
                      borderRadius: 1,
                      p: 2,
                      mb: 3,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#999999' }}>
                        Monthly
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: '#ffffff', fontWeight: 600 }}
                      >
                        {tier.monthlyFee}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#999999' }}>
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

                  {/* CTA Button */}
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setApplicationModalOpen(true)}
                    sx={{
                      mt: 'auto',
                      py: 1.5,
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: '#d4af37',
                      borderColor: '#d4af37',
                      '&:hover': {
                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                        borderColor: '#c49d2f',
                      },
                    }}
                  >
                    Learn More
                  </Button>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Typography
            variant="body1"
            sx={{
              color: '#999999',
              textAlign: 'center',
              mt: 6,
              fontSize: '0.95rem',
              fontStyle: 'italic',
            }}
          >
            Take the first step toward a more profitable and empowered real estate career
          </Typography>

          {/* Join Us Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              onClick={() => setApplicationModalOpen(true)}
              sx={{
                px: 4,
                py: 1.5,
                backgroundColor: '#d4af37',
                color: '#1a1a1a',
                fontWeight: 600,
                fontSize: '1.125rem',
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: '0 8px 16px rgba(212, 175, 55, 0.3)',
                '&:hover': {
                  backgroundColor: '#c49d2f',
                },
              }}
            >
              Join Us
            </Button>
          </Box>
        </motion.div>
      </Container>

      {/* Agent Application Modal */}
      <AgentApplicationModal
        open={applicationModalOpen}
        onClose={() => setApplicationModalOpen(false)}
      />
    </Box>
  );
}
