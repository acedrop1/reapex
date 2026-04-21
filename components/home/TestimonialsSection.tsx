'use client';

import { Container, Typography, Box, Grid, Card, CardContent, Avatar, Chip } from '@mui/material';
import { Quotes, ChatCircleText } from '@phosphor-icons/react/dist/ssr';

export function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Joining Reapex was the single best financial decision I've made for my business. The technology is seamless, and the support is second to none.",
      name: "Robert Daniels",
      role: "Agent",
      image: "/images/robert-d.webp"
    },
    {
      quote: "From the professional photography to the targeted ads, Reapex handled everything. We had multiple offers within a week and closed 5% above list price. Highly recommend.",
      name: "Sarah N.",
      role: "Seller - Cliffside Park",
      image: "/images/sara-n.webp"
    },
    {
      quote: "The map + live listings made touring neighborhoods so much easier. We filtered exactly to our must-haves and saved hours of irrelevant viewings.",
      name: "Erin G.",
      role: "Buyer - Fort Lee",
      image: "/images/erin-g.webp"
    }
  ];

  return (
    <Box sx={{ py: 8, backgroundColor: '#ffffff' }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 6, mx: 'auto', maxWidth: 900 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Chip
              icon={<ChatCircleText size={20} weight="bold" />}
              label="Testimonials"
              sx={{
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                fontWeight: 600,
                px: 2,
                py: 2.5,
                fontSize: '0.95rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                '& .MuiChip-icon': {
                  color: '#ffffff',
                },
              }}
            />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#333333', mb: 2 }}>
            What Our Partners are Saying
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            More than an agent. A Strategic Partner for Your Most Valuable Asset. Your Real Estate Goals, Achieved. Partner with a Reapex Agent.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  }
                }}
              >
                <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ mb: 3 }}>
                    <Quotes size={40} weight="fill" color="#1a1a1a" />
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      flexGrow: 1,
                      fontStyle: 'italic',
                      color: '#333333',
                      lineHeight: 1.7
                    }}
                  >
                    "{testimonial.quote}"
                  </Typography>
                  <Box sx={{ borderTop: '2px solid #f5f5f5', pt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={testimonial.image}
                      alt={testimonial.name}
                      sx={{
                        width: 64,
                        height: 64,
                        border: '3px solid #f5f5f5',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
