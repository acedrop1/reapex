'use client';

import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import {
  UsersThree,
  MegaphoneSimple,
  Globe,
  ChartLine,
  Headset,
} from '@phosphor-icons/react';

const solutions = [
  {
    icon: UsersThree,
    title: 'Reapex Team Platform Model',
    description: 'Build and manage your real estate team with powerful collaboration tools and revenue sharing capabilities.',
  },
  {
    icon: MegaphoneSimple,
    title: 'Lead-Gen Accelerator Add-On',
    description: 'Supercharge your pipeline with AI-powered lead generation and automated follow-up systems.',
  },
  {
    icon: Globe,
    title: 'Customizable Agent Subdomain Website',
    description: 'Launch your professional online presence with a fully customizable agent website and subdomain.',
  },
  {
    icon: ChartLine,
    title: 'Marketing Autopilot Tools',
    description: 'Automate your marketing campaigns with smart scheduling, email sequences, and social media management.',
  },
  {
    icon: Headset,
    title: 'Direct Broker Access',
    description: 'Get personalized support when you need it with direct access to experienced broker guidance.',
  },
];

export default function ReapexSolutions() {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: '#0a0a0a',
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
            Reapex Solutions
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
            Everything you need to build, grow, and scale your real estate business
          </Typography>
        </motion.div>

        <Grid container spacing={3}>
          {solutions.map((solution, index) => {
            const Icon = solution.icon;
            return (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      height: '100%',
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#d4af37',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(212, 175, 55, 0.1)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                        mb: 3,
                      }}
                    >
                      <Icon size={32} weight="duotone" color="#d4af37" />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        mb: 2,
                                }}
                    >
                      {solution.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#999999',
                        lineHeight: 1.7,
                      }}
                    >
                      {solution.description}
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}
