'use client';

import { Container, Typography, Box, Grid, Card, CardContent, Chip } from '@mui/material';
import { Quotes, Users, TrendUp } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

interface AgentTestimonial {
  quote: string;
  metric: string;
  metricLabel: string;
}

const AGENT_TESTIMONIALS: AgentTestimonial[] = [
  {
    quote: "I increased my take-home pay by 22% in my first year at Reapex. The 90/10 split and low cap meant I kept more of what I earned. Plus, the tech stack actually helps me close deals faster.",
    metric: "+22%",
    metricLabel: "Increased Take-Home",
  },
  {
    quote: "Switching from my old brokerage was the best decision I ever made. No more waiting for commission checks—I get paid instantly at close. The Accelerator program has brought me 3 qualified leads this quarter alone.",
    metric: "$47K+",
    metricLabel: "Additional Income (Year 1)",
  },
  {
    quote: "Reapex doesn't just talk about supporting agents—they actually do it. 24/7 transaction support, instant commission disbursement, and a tech platform that doesn't make me want to throw my laptop. Finally, a brokerage that gets it.",
    metric: "100%",
    metricLabel: "Commission Split",
  },
];

export default function AgentTestimonialsSection() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#f5f5f5' }}>
      <Container maxWidth="xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 8, mx: 'auto', maxWidth: 900 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Chip
                icon={<Users size={20} weight="duotone" />}
                label="Agent Success Stories"
                sx={{
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  fontWeight: 600,
                  px: 2,
                  py: 2.5,
                  fontSize: '0.95rem',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  '& .MuiChip-icon': {
                    color: '#d4af37',
                  },
                }}
              />
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                mb: 2,
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              Real Agents. Real Results.
            </Typography>
          </Box>
        </motion.div>

        {/* Testimonial Cards */}
        <Grid container spacing={4}>
          {AGENT_TESTIMONIALS.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                style={{ height: '100%' }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    borderRadius: 3,
                    border: '1px solid #e0e0e0',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                      borderColor: '#d4af37',
                    },
                  }}
                >
                  {/* Metric Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -16,
                      right: 20,
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <TrendUp size={16} weight="bold" />
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                      {testimonial.metric}
                    </Typography>
                  </Box>

                  <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Quote Icon */}
                    <Box sx={{ mb: 3 }}>
                      <Quotes size={40} weight="fill" color="#d4af37" />
                    </Box>

                    {/* Quote */}
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        flexGrow: 1,
                        fontStyle: 'italic',
                        color: '#333333',
                        lineHeight: 1.7,
                        fontSize: '1rem',
                      }}
                    >
                      &quot;{testimonial.quote}&quot;
                    </Typography>

                    {/* Metric Label */}
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: '#16a34a15',
                        borderRadius: 2,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600, fontSize: '0.75rem' }}>
                        {testimonial.metricLabel}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
