'use client';

import { useState } from 'react';
import { Container, Typography, Box, TextField, Button, Grid, Chip } from '@mui/material';
import { Rocket, ShieldCheck, Clock, EnvelopeSimple } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import AgentApplicationModal from '@/components/modals/AgentApplicationModal';

export default function AgentOnboardingFooter() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [prefilledEmail, setPrefilledEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Open modal with prefilled email
    if (email) {
      setPrefilledEmail(email);
      setApplicationModalOpen(true);
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      id="onboarding"
      sx={{
        py: { xs: 10, md: 14 },
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6} alignItems="center">
          {/* Left Side: Content */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Rocket size={48} weight="duotone" color="#d4af37" />
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2rem', md: '3rem' },
                    lineHeight: 1.1,
                  }}
                >
                  Ready to Upgrade Your Career?
                </Typography>
              </Box>

              <Typography
                variant="h6"
                sx={{
                  color: '#cccccc',
                  mb: 4,
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                The traditional brokerage model was built for the broker, not the agent. See the difference with Reapex.
              </Typography>
            </motion.div>
          </Grid>

          {/* Right Side: Form */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  p: { xs: 4, md: 5 },
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: 3,
                    textAlign: 'center',
                    color: '#ffffff',
                    lineHeight: 1.3,
                  }}
                >
                  Take Back Control of Your Career
                </Typography>

                {/* Email Input */}
                <TextField
                  fullWidth
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                      borderRadius: 2,
                      fontSize: '1.125rem',
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                        borderWidth: 2,
                      },
                      '&:hover fieldset': {
                        borderColor: '#d4af37',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#d4af37',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      py: 2,
                    },
                  }}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isSubmitting}
                  sx={{
                    py: 2.5,
                    backgroundColor: '#d4af37',
                    color: '#1a1a1a',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: '#c49d2f',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(212, 175, 55, 0.5)',
                    },
                    '&:disabled': {
                      backgroundColor: '#999999',
                      color: '#ffffff',
                    },
                  }}
                >
                  {isSubmitting ? 'Processing...' : 'Join Reapex'}
                </Button>

                {/* Privacy Note */}
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'center',
                    color: '#999999',
                    mt: 2,
                    lineHeight: 1.5,
                  }}
                >
                  By submitting, you agree to our Terms of Service and Privacy Policy.
                  We&apos;ll never share your information.
                </Typography>
              </Box>

              {/* Social Proof */}
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#999999', mb: 2 }}>
                  Switch to the brokerage that puts you first
                </Typography>
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* Agent Application Modal with Email Prefill */}
      <AgentApplicationModal
        open={applicationModalOpen}
        onClose={() => setApplicationModalOpen(false)}
        initialEmail={prefilledEmail}
      />
    </Box>
  );
}
