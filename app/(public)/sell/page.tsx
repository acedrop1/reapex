'use client';

import { useState } from 'react';
import { Container, Typography, Box, Grid, Card, Button, TextField, FormControl, InputLabel, Select, MenuItem, Alert, Snackbar } from '@mui/material';
import {
  User,
  Envelope,
  Phone,
  MapPin,
  CurrencyDollar,
  ChatCircleText,
  PaperPlaneRight,
  TrendUp,
  ChartLine,
  MegaphoneSimple,
  Users,
  CheckCircle,
  ShareNetwork,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';

export default function SellPage() {
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      property_address: formData.get('address'),
      property_type: formData.get('property_type'),
      estimated_value: formData.get('estimated_value'),
      message: formData.get('message'),
      source: 'sell_page',
    };

    try {
      const response = await fetch('/api/sell-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      setShowSuccess(true);
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to submit request');
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const distributionChannels = [
    { icon: Users, label: 'Agent Network', value: '200+ Agents', color: '#16a34a' },
    { icon: ChartLine, label: 'Premium Portals', value: 'Top 10 Sites', color: '#c49d2f' },
    { icon: TrendUp, label: 'Direct Buyers', value: 'VIP Database', color: '#d4af37' },
    { icon: ShareNetwork, label: 'Targeted Social', value: 'AI-Driven Ad Campaigns', color: '#E2C05A' },
  ];

  const benefits = [
    'Maximum exposure across all channels',
    'Professional photography and videography',
    'Virtual tours and 3D walkthroughs',
    'Targeted marketing to qualified buyers',
    'Real-time pricing analytics',
    'Expert negotiation support',
  ];

  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          backgroundColor: '#0a0a0a',
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          pt: 12,
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={6} alignItems="center">
            {/* Left: Hero Text */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    color: '#d4af37',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    letterSpacing: '0.15em',
                    mb: 2,
                    display: 'block',
                  }}
                >
                  List Your Property
                </Typography>
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2.5rem', md: '4.5rem' },
                    color: '#ffffff',
                    mb: 3,
                    lineHeight: 1.1,
                  }}
                >
                  Smarter Marketing.
                  <br />
                  <Box component="span" sx={{ color: '#d4af37' }}>
                    Higher Returns.
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
                  Experience a data-driven approach to selling your home. We combine advanced digital targeting with local expertise to maximize your sale price.
                </Typography>

                {/* Benefits Checklist */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {benefits.slice(0, 3).map((benefit, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CheckCircle size={24} weight="fill" color="#16a34a" />
                      <Typography
                        sx={{
                          color: '#cccccc',
                                fontSize: '1rem',
                        }}
                      >
                        {benefit}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </motion.div>
            </Grid>

            {/* Right: Distribution Network Visualization */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Box
                  sx={{
                    p: 4,
                    backgroundColor: '#141414',
                    borderRadius: 3,
                    border: '1px solid #333333',
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                      color: '#ffffff',
                      mb: 4,
                      textAlign: 'center',
                    }}
                  >
                    Reapex Distribution Network
                  </Typography>

                  <Grid container spacing={3}>
                    {distributionChannels.map((channel, idx) => {
                      const Icon = channel.icon;
                      return (
                        <Grid item xs={12} md={6} key={idx}>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                          >
                            <Box
                              sx={{
                                p: 3,
                                backgroundColor: '#0a0a0a',
                                borderRadius: 2,
                                border: `1px solid ${channel.color}40`,
                                textAlign: { xs: 'left', md: 'center' },
                                transition: 'all 0.3s ease',
                                height: { xs: 'auto', md: '180px' },
                                display: 'flex',
                                flexDirection: { xs: 'row', md: 'column' },
                                justifyContent: { xs: 'flex-start', md: 'center' },
                                alignItems: { xs: 'flex-start', md: 'center' },
                                '&:hover': {
                                  borderColor: channel.color,
                                  transform: 'translateY(-4px)',
                                  boxShadow: `0 8px 32px ${channel.color}40`,
                                },
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'inline-flex',
                                  p: 2,
                                  backgroundColor: `${channel.color}20`,
                                  borderRadius: 2,
                                  mb: { xs: 0, md: 2 },
                                  mr: { xs: 2, md: 0 },
                                }}
                              >
                                <Icon size={32} weight="duotone" color={channel.color} />
                              </Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  textAlign: { xs: 'left', md: 'center' },
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: '#999999',
                                    mb: 1,
                                  }}
                                >
                                  {channel.label}
                                </Typography>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    color: channel.color,
                                    fontWeight: 700,
                                  }}
                                >
                                  {channel.value}
                                </Typography>
                              </Box>
                            </Box>
                          </motion.div>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Form Section */}
      <Box sx={{ backgroundColor: '#0a0a0a', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="overline"
              sx={{
                color: '#d4af37',
                fontWeight: 700,
                fontSize: '0.875rem',
                letterSpacing: '0.15em',
                mb: 2,
                display: 'block',
              }}
            >
              Get Started
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 800,
                color: '#ffffff',
                mb: 2,
              }}
            >
              Request a Free Property Valuation
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#999999',
                fontFamily: 'DM Sans, sans-serif',
                maxWidth: 700,
                mx: 'auto',
              }}
            >
              Fill out the form below. A Reapex Advisor will contact you to discuss your goals.
            </Typography>
          </Box>

          <Card
            sx={{
              p: { xs: 4, md: 6 },
              backgroundColor: '#141414',
              border: '1px solid #333333',
              borderRadius: 3,
            }}
          >
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ position: 'relative' }}>
                    <User
                      size={20}
                      weight="duotone"
                      style={{ position: 'absolute', left: 14, top: 18, zIndex: 1, color: '#999' }}
                    />
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          backgroundColor: '#0a0a0a',
                          '& fieldset': {
                            borderColor: '#333333',
                          },
                          '&:hover fieldset': {
                            borderColor: '#d4af37',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#d4af37',
                          },
                          '& input': {
                            pl: '48px',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#999999',
                          pl: '40px',
                          '&.Mui-focused': {
                            color: '#d4af37',
                          },
                        },
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ position: 'relative' }}>
                    <Envelope
                      size={20}
                      weight="duotone"
                      style={{ position: 'absolute', left: 14, top: 18, zIndex: 1, color: '#999' }}
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          backgroundColor: '#0a0a0a',
                          '& fieldset': {
                            borderColor: '#333333',
                          },
                          '&:hover fieldset': {
                            borderColor: '#d4af37',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#d4af37',
                          },
                          '& input': {
                            pl: '48px',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#999999',
                          pl: '40px',
                          '&.Mui-focused': {
                            color: '#d4af37',
                          },
                        },
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ position: 'relative' }}>
                    <Phone
                      size={20}
                      weight="duotone"
                      style={{ position: 'absolute', left: 14, top: 18, zIndex: 1, color: '#999' }}
                    />
                    <TextField
                      fullWidth
                      label="Phone"
                      name="phone"
                      type="tel"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          backgroundColor: '#0a0a0a',
                          '& fieldset': {
                            borderColor: '#333333',
                          },
                          '&:hover fieldset': {
                            borderColor: '#d4af37',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#d4af37',
                          },
                          '& input': {
                            pl: '48px',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#999999',
                          pl: '40px',
                          '&.Mui-focused': {
                            color: '#d4af37',
                          },
                        },
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ position: 'relative' }}>
                    <MapPin
                      size={20}
                      weight="duotone"
                      style={{ position: 'absolute', left: 14, top: 18, zIndex: 1, color: '#999' }}
                    />
                    <TextField
                      fullWidth
                      label="Property Address"
                      name="address"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          backgroundColor: '#0a0a0a',
                          '& fieldset': {
                            borderColor: '#333333',
                          },
                          '&:hover fieldset': {
                            borderColor: '#d4af37',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#d4af37',
                          },
                          '& input': {
                            pl: '48px',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#999999',
                          pl: '40px',
                          '&.Mui-focused': {
                            color: '#d4af37',
                          },
                        },
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#ffffff',
                        backgroundColor: '#0a0a0a',
                        '& fieldset': {
                          borderColor: '#333333',
                        },
                        '&:hover fieldset': {
                          borderColor: '#d4af37',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#d4af37',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#999999',
                        '&.Mui-focused': {
                          color: '#d4af37',
                        },
                      },
                      '& .MuiSelect-icon': {
                        color: '#999999',
                      },
                    }}
                  >
                    <InputLabel>Property Type</InputLabel>
                    <Select name="property_type" label="Property Type" defaultValue="">
                      <MenuItem value="house">House</MenuItem>
                      <MenuItem value="townhome">Townhome</MenuItem>
                      <MenuItem value="multi_family">Multi-family</MenuItem>
                      <MenuItem value="condo">Condo/Co-op</MenuItem>
                      <MenuItem value="apartment">Apartment</MenuItem>
                      <MenuItem value="commercial">Commercial</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ position: 'relative' }}>
                    <CurrencyDollar
                      size={20}
                      weight="duotone"
                      style={{ position: 'absolute', left: 14, top: 18, zIndex: 1, color: '#999' }}
                    />
                    <TextField
                      fullWidth
                      label="Estimated Value"
                      name="estimated_value"
                      type="number"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          backgroundColor: '#0a0a0a',
                          '& fieldset': {
                            borderColor: '#333333',
                          },
                          '&:hover fieldset': {
                            borderColor: '#d4af37',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#d4af37',
                          },
                          '& input': {
                            pl: '48px',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#999999',
                          pl: '40px',
                          '&.Mui-focused': {
                            color: '#d4af37',
                          },
                        },
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ position: 'relative' }}>
                    <ChatCircleText
                      size={20}
                      weight="duotone"
                      style={{ position: 'absolute', left: 14, top: 18, zIndex: 1, color: '#999' }}
                    />
                    <TextField
                      fullWidth
                      label="Additional Details"
                      name="message"
                      multiline
                      rows={4}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          backgroundColor: '#0a0a0a',
                          '& fieldset': {
                            borderColor: '#333333',
                          },
                          '&:hover fieldset': {
                            borderColor: '#d4af37',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#d4af37',
                          },
                          '& textarea': {
                            pl: '48px',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#999999',
                          pl: '40px',
                          '&.Mui-focused': {
                            color: '#d4af37',
                          },
                        },
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={submitting}
                    startIcon={<PaperPlaneRight size={20} weight="bold" />}
                    sx={{
                      backgroundColor: '#d4af37',
                      color: '#0a0a0a',
                        fontWeight: 700,
                      fontSize: '1.125rem',
                      py: 2,
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: '#c49d2f',
                      },
                      '&:disabled': {
                        backgroundColor: '#666666',
                        color: '#333333',
                      },
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Get Free Valuation'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Container>
      </Box>

      {/* Success/Error Notifications */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          sx={{
            width: '100%',
            backgroundColor: '#141414',
            color: '#16a34a',
            border: '1px solid #16a34a',
          }}
        >
          Thank you! Your request has been submitted. We'll contact you within 24 hours.
        </Alert>
      </Snackbar>
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowError(false)}
          severity="error"
          sx={{
            width: '100%',
            backgroundColor: '#141414',
            color: '#dc2626',
            border: '1px solid #dc2626',
          }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
