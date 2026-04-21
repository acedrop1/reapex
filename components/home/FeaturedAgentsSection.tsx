'use client';

import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  Button,
  CardActionArea,
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Agent {
  id: string;
  full_name: string;
  headshot_url: string | null;
  slug: string;
  specialties?: string[];
  agent_ratings_summary?: {
    average_rating: number;
    total_reviews: number;
  };
}

interface FeaturedAgentsSectionProps {
  agents: Agent[];
}

export default function FeaturedAgentsSection({ agents }: FeaturedAgentsSectionProps) {

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#ffffff' }}>
      <Container maxWidth="xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                mb: 2,
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              Meet the Reapex Team
            </Typography>
          </Box>
        </motion.div>

        {/* Agent Cards Grid */}
        {agents.length > 0 ? (
          <Grid container spacing={4}>
            {agents.map((agent, index) => (
              <Grid item xs={12} sm={6} md={4} key={agent.id}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  style={{ height: '100%' }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: 3,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                      },
                    }}
                  >
                    <CardActionArea
                      component={Link}
                      href={`/agent/${agent.slug}`}
                      sx={{ height: '100%', position: 'relative' }}
                    >
                      {/* Agent Photo */}
                      <Box
                        sx={{
                          height: 400,
                          backgroundImage: `url(${agent.headshot_url || '/images/default-avatar.png'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative',
                        }}
                      >
                        {/* Black Box at Bottom with Name */}
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: '#0a0a0a',
                            padding: '20px',
                            textAlign: 'center',
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              color: '#ffffff',
                              fontWeight: 600,
                              fontSize: '1.125rem',
                            }}
                          >
                            {agent.full_name}
                          </Typography>
                        </Box>
                      </Box>
                    </CardActionArea>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No agents found.
            </Typography>
          </Box>
        )}

        {/* View All Agents CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Button
              component={Link}
              href="/agents"
              variant="outlined"
              size="large"
              sx={{
                px: 5,
                py: 2,
                borderColor: '#1a1a1a',
                color: '#1a1a1a',
                fontWeight: 600,
                fontSize: '1.125rem',
                borderRadius: 2,
                textTransform: 'none',
                borderWidth: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              View All Agents
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
