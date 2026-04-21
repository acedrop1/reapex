'use client';

import { Box, Container, Typography, Grid, Card, Divider } from '@mui/material';
import { XCircle, CheckCircle, Scales } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

interface ComparisonRow {
  category: string;
  traditional: string;
  reapex: string;
}

const COMPARISON_DATA: ComparisonRow[] = [
  {
    category: 'Commission Split',
    traditional: 'Rigid 50/50, 60/40 or 70/30',
    reapex: 'Flexible 80/20 to 100%',
  },
  {
    category: 'Technology Stack',
    traditional: 'Clunky Intranet & Outdated Tools',
    reapex: 'Integrated Agent OS with Modern Tech',
  },
  {
    category: 'Getting Paid',
    traditional: 'Wait Days or Weeks for Checks',
    reapex: 'Instant Clear-to-Close Payments',
  },
  {
    category: 'Lead Generation',
    traditional: "You're on Your Own",
    reapex: 'Accelerator 50/50 Split Program',
  },
  {
    category: 'Monthly Fees',
    traditional: '$500-$1,500+ Desk, Tech Fees & High Annual Cap',
    reapex: 'Low Annual Cap, No Hidden Fees',
  },
  {
    category: 'Support & Training',
    traditional: 'Limited to Office Hours',
    reapex: '24/7 Support & Ongoing Training',
  },
];

export default function ModelComparison() {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
      }}
    >
      <Container maxWidth="xl">
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
              <Scales size={40} weight="duotone" color="#d4af37" />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: '#ffffff',
                  fontSize: { xs: '2rem', md: '3rem' },
                }}
              >
                Old Vs. New
              </Typography>
            </Box>
          </motion.div>
        </Box>

        {/* Comparison Table */}
        <Card
          sx={{
            backgroundColor: 'transparent',
            boxShadow: 'none',
            overflow: 'visible',
          }}
        >
          {/* Table Header */}
          <Grid container spacing={0}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 4,
                  backgroundColor: '#333333',
                  borderRadius: { xs: '16px 16px 0 0', md: '16px 0 0 0' },
                  textAlign: 'center',
                  borderBottom: { xs: '1px solid #444444', md: 'none' },
                  borderRight: { md: '1px solid #444444' },
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#999999', mb: 1 }}>
                  Traditional Brokerage
                </Typography>
                <Typography variant="body2" sx={{ color: '#666666' }}>
                  The way it&apos;s always been
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 4,
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
                  borderRadius: { xs: '0', md: '0 16px 0 0' },
                  textAlign: 'center',
                  border: '2px solid #d4af37',
                  borderBottom: { xs: '1px solid #d4af37', md: '2px solid #d4af37' },
                  borderLeft: { md: 'none' },
                  position: 'relative',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#d4af37', mb: 1 }}>
                  Reapex Model
                </Typography>
                <Typography variant="body2" sx={{ color: '#cccccc' }}>
                  Built for the modern agent
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Comparison Rows */}
          {COMPARISON_DATA.map((row, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Grid
                container
                spacing={0}
                sx={{
                  '&:hover': {
                    '& .traditional-cell': {
                      backgroundColor: '#3a3a3a',
                    },
                    '& .reapex-cell': {
                      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
                    },
                  },
                }}
              >
                {/* Traditional Column */}
                <Grid item xs={12} md={6}>
                  <Box
                    className="traditional-cell"
                    sx={{
                      p: 3,
                      backgroundColor: '#2a2a2a',
                      borderRight: { md: '1px solid #444444' },
                      borderBottom: '1px solid #444444',
                      transition: 'all 0.3s ease',
                      minHeight: '100px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={2} sx={{ textAlign: 'center' }}>
                        <XCircle size={32} weight="fill" color="#dc2626" />
                      </Grid>
                      <Grid item xs={10}>
                        <Typography variant="body2" sx={{ color: '#999999', mb: 0.5, fontSize: '0.75rem' }}>
                          {row.category}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#cccccc', fontWeight: 500 }}>
                          {row.traditional}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                {/* Reapex Column */}
                <Grid item xs={12} md={6}>
                  <Box
                    className="reapex-cell"
                    sx={{
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
                      borderBottom: index === COMPARISON_DATA.length - 1 ? 'none' : '1px solid #d4af3740',
                      borderLeft: { md: '2px solid #d4af37' },
                      borderRight: { md: '2px solid #d4af37' },
                      borderBottomLeftRadius: { xs: 0, md: index === COMPARISON_DATA.length - 1 ? '16px' : 0 },
                      borderBottomRightRadius: index === COMPARISON_DATA.length - 1 ? '16px' : 0,
                      transition: 'all 0.3s ease',
                      minHeight: '100px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={2} sx={{ textAlign: 'center' }}>
                        <CheckCircle size={32} weight="fill" color="#16a34a" />
                      </Grid>
                      <Grid item xs={10}>
                        <Typography variant="body2" sx={{ color: '#d4af37', mb: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>
                          {row.category}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600 }}>
                          {row.reapex}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </motion.div>
          ))}
        </Card>

      </Container>
    </Box>
  );
}
