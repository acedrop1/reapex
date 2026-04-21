'use client';

import { useState } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { TrendUp, ListChecks } from '@phosphor-icons/react';
import { HeroSearchForm } from '@/components/search/HeroSearchForm';
import AgentApplicationModal from '@/components/modals/AgentApplicationModal';

interface AgentHeroSectionProps {
  cities: string[];
}

export default function AgentHeroSection({ cities }: AgentHeroSectionProps) {
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);


  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh + 80px)', md: '100vh' },
        color: '#ffffff',
        position: 'relative',
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0a0a',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      }}
    >

      {/* Content Container */}
      <Container
        maxWidth="xl"
        sx={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          py: 4,
        }}
      >
        {/* Main Hero Content - Centered */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            mb: 8,
            pt: { xs: 10, md: 16 }, // Added padding top
          }}
        >
          {/* Animated Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2rem', sm: '3rem', md: '4.5rem', lg: '5.5rem' }, // Reduced font size
                mb: 3,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              IT&apos;S YOUR COMMISSION.
              <br />
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #f4d584 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                KEEP MORE OF IT.
              </Box>
            </Typography>
          </motion.div>

          {/* Animated Sub-headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 400,
                fontSize: { xs: '1.125rem', sm: '1.5rem', md: '2rem' },
                mb: 6,
                maxWidth: '900px',
                mx: 'auto',
                textShadow: '0 2px 16px rgba(0,0,0,0.5)',
                color: '#f5f5f5',
              }}
            >
              The old brokerage model is broken. Switch to the platform that treats you like a partner, not a number.
            </Typography>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 3,
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* Primary CTA - Join Us */}
              <Button
                onClick={() => setApplicationModalOpen(true)}
                variant="contained"
                size="large"
                startIcon={<TrendUp size={24} weight="duotone" />}
                sx={{
                  backgroundColor: '#d4af37',
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  px: { xs: 4, md: 6 },
                  py: { xs: 2, md: 2.5 },
                  borderRadius: 3,
                  textTransform: 'none',
                  boxShadow: '0 8px 32px rgba(212, 175, 55, 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#c49d2f',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(212, 175, 55, 0.5)',
                  },
                }}
              >
                Join Us
              </Button>

              {/* Secondary CTA - View Commission Menu */}
              <Button
                component="a"
                href="#commission-menu"
                variant="outlined"
                size="large"
                startIcon={<ListChecks size={24} weight="duotone" />}
                sx={{
                  borderColor: '#ffffff',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  px: { xs: 4, md: 6 },
                  py: { xs: 2, md: 2.5 },
                  borderRadius: 3,
                  textTransform: 'none',
                  borderWidth: 2,
                  backdropFilter: 'blur(8px)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#d4af37',
                    backgroundColor: 'rgba(212, 175, 55, 0.2)',
                    color: '#d4af37',
                    transform: 'translateY(-4px)',
                    borderWidth: 2,
                  },
                }}
              >
                Commission Menu
              </Button>
            </Box>
          </motion.div>
        </Box>

        {/* Search Bar at Bottom - Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          style={{ marginBottom: '2rem', paddingBottom: '32px' }}
        >

          <HeroSearchForm cities={cities} />
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
