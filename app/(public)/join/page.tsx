'use client';

import { useState } from 'react';
import { Container, Typography, Box, Grid, Button } from '@mui/material';
import { ArrowRight, CheckCircle, XCircle } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import TechStackCarousel from '@/components/join/TechStackCarousel';
import CommissionTiersDetailed from '@/components/join/CommissionTiersDetailed';
import AgentApplicationModal from '@/components/modals/AgentApplicationModal';

export default function JoinPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Box sx={{ backgroundColor: '#0a0a0a', pt: 10 }}>
        {/* Section 1: Problem & Solution Side-by-Side */}
        <Container maxWidth="xl" sx={{ py: { xs: 8, md: 12 } }}>
          <Grid container spacing={6} alignItems="stretch">
            {/* Left: The Problem */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    color: '#dc2626',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    letterSpacing: '0.15em',
                    mb: 2,
                    display: 'block',
                  }}
                >
                  The Problem
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2rem', md: '3rem' },
                    color: '#ffffff',
                    mb: 3,
                    lineHeight: 1.1,
                  }}
                >
                  <Box component="span" sx={{ color: '#dc2626' }}>
                    Full-Time Work.
                  </Box>
                  <br />
                  Part-Time Pay.
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#999999',
                    lineHeight: 1.8,
                    mb: 4,
                  }}
                >
                  The old way is slow, expensive, and frustrating. Traditional brokerages were designed to extract wealth from agents, not build it. You shouldn't be penalized for your own production.
                </Typography>

                {/* Problem Points */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    'You work the leads, they eat the profits',
                    'Junk fees that bleed your bottom line',
                    'Clunky 1990\'s tech that slows you down',
                    'No real support when you need it',
                  ].map((problem, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <XCircle size={24} weight="fill" color="#dc2626" />
                      <Typography
                        sx={{
                          color: '#cccccc',
                          fontSize: '1.125rem',
                        }}
                      >
                        {problem}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </motion.div>
            </Grid>

            {/* Right: The Solution */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    color: '#16a34a',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    letterSpacing: '0.15em',
                    mb: 2,
                    display: 'block',
                  }}
                >
                  The Solution
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2rem', md: '3rem' },
                    color: '#ffffff',
                    mb: 3,
                    lineHeight: 1.1,
                  }}
                >
                  A True
                  <Box component="span" sx={{ color: '#d4af37' }}>
                    {' '}Partnership Platform
                  </Box>
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#999999',
                    lineHeight: 1.8,
                    mb: 4,
                  }}
                >
                  The Reapex system is automated, lean, and profitable. We built a streamlined platform to up your productivity, eliminate admin work and grow your brand. We provide the infrastructure; you keep the profit.
                </Typography>

                {/* Solution Points */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    'High-Split / Low-Cap Model',
                    'All-in-One Agent Operating System',
                    'Concierge-level Brokerage Support',
                    'A clear path to financial freedom',
                  ].map((solution, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CheckCircle size={24} weight="fill" color="#16a34a" />
                      <Typography
                        sx={{
                          color: '#cccccc',
                          fontSize: '1.125rem',
                        }}
                      >
                        {solution}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>

        {/* Section 2: Reapex Solutions - Tech Stack */}
        <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#141414' }}>
          <Container maxWidth="xl">
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    color: '#ffffff',
                    mb: 3,
                  }}
                >
                  Reapex Solutions
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#999999',
                    maxWidth: '700px',
                    mx: 'auto',
                  }}
                >
                  Everything you need to succeed, all in one platform.
                </Typography>
              </motion.div>
            </Box>

            <TechStackCarousel />
          </Container>
        </Box>

        {/* Section 3: Commission Menu */}
        <CommissionTiersDetailed />

        {/* Final CTA Section */}
        <Box
          sx={{
            py: { xs: 10, md: 14 },
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
            textAlign: 'center',
          }}
        >
          <Container maxWidth="md">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '2rem', md: '3rem' },
                  color: '#ffffff',
                  mb: 6,
                }}
              >
                Ready to Take Control?
              </Typography>

              <Button
                onClick={() => setModalOpen(true)}
                variant="contained"
                size="large"
                endIcon={<ArrowRight size={24} weight="bold" />}
                sx={{
                  backgroundColor: '#d4af37',
                  color: '#0a0a0a',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  px: 6,
                  py: 2.5,
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(212, 175, 55, 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#c49d2f',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(212, 175, 55, 0.5)',
                  },
                }}
              >
                Start Your Application
              </Button>

              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 3,
                  color: '#666666',
                }}
              >
                100% Confidential · Takes 2 Minutes
              </Typography>
            </motion.div>
          </Container>
        </Box>
      </Box>

      {/* Application Modal */}
      <AgentApplicationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
