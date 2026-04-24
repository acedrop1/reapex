'use client';

import { useState } from 'react';
import { Box, Typography, IconButton, Grid, useMediaQuery, useTheme } from '@mui/material';
import { CaretLeft, CaretRight, Users, MegaphoneSimple, Headset, FileText, UsersThree, TrendUp, Globe } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

const techStackSlides = [
  {
    icon: FileText,
    title: 'Transaction Management Suite',
    subtitle: 'All-in-One',
    description: 'Streamlined transaction management from contract to close with document and compliance management.',
    features: ['Secure Document Vault', 'Compliance Tracking', 'Transaction Command Center'],
    color: '#d4af37',
  },
  {
    icon: UsersThree,
    title: 'Reapex Team Platform Model',
    subtitle: 'Build Your Team',
    description: 'Collaborative platform for building and managing your real estate team with automated wealth-building tools',
    features: ['Unlimited Agents (No Monthly Fee)', 'Performance Tracking', 'Team Command Center'],
    color: '#16a34a',
  },
  {
    icon: TrendUp,
    title: 'Lead-Gen Accelerator',
    subtitle: 'Grow Your Business',
    description: 'Lead generation tools with targeted advertising, landing pages, and conversion optimization.',
    features: ['Targeted Ad Manager', 'High-Converting Landing Pages', 'Instant CRM Sync'],
    color: '#e2c05a',
  },
  {
    icon: Globe,
    title: 'Digital Agent HQ',
    subtitle: 'Your Brand',
    description: 'A fully branded, mobile-first website designed to capture leads and showcase your authority.',
    features: ['Custom Branding Suite', 'SEO-Optimized Architecture', 'Mobile-First Design'],
    color: '#c49d2f',
  },
  {
    icon: MegaphoneSimple,
    title: 'Marketing Autopilot Tools',
    subtitle: 'AI-Powered',
    description: 'AI-driven content and campaigns that keep your brand visible 24/7.',
    features: ['Social Media Content Hub', 'Email Drip Campaigns', 'Performance Analytics'],
    color: '#f0d98a',
  },
  {
    icon: Headset,
    title: 'Direct Broker Access',
    subtitle: 'On Demand Support',
    description: 'Direct access to experienced brokers who understand your business and help you navigate complex deals.',
    features: ['Contract Review', 'Compliance Support', 'Training Resources'],
    color: '#d4af37',
  },
];

export default function TechStackCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? techStackSlides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === techStackSlides.length - 1 ? 0 : prev + 1));
  };

  // Render individual solution card
  const renderCard = (slide: typeof techStackSlides[0], index: number) => {
    const Icon = slide.icon;
    return (
      <Box
        key={index}
        sx={{
          p: { xs: 3, md: 4 },
          backgroundColor: '#141414',
          borderRadius: 2,
          border: `2px solid ${slide.color}40`,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: slide.color,
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 32px ${slide.color}40`,
          },
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            display: 'inline-flex',
            p: 2,
            backgroundColor: `${slide.color}20`,
            borderRadius: 2,
            mb: 2,
            alignSelf: 'flex-start',
          }}
        >
          <Icon size={40} weight="duotone" color={slide.color} />
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#ffffff',
            mb: 0.5,
          }}
        >
          {slide.title}
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="caption"
          sx={{
            color: slide.color,
            fontWeight: 600,
            mb: 2,
          }}
        >
          {slide.subtitle}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: '#cccccc',
            lineHeight: 1.6,
            mb: 3,
            flexGrow: 1,
          }}
        >
          {slide.description}
        </Typography>

        {/* Features Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 1,
          }}
        >
          {slide.features.map((feature, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: slide.color,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#999999',
                        fontSize: '0.875rem',
                }}
              >
                {feature}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  // Mobile: Carousel view
  if (isMobile) {
    const currentSlide = techStackSlides[currentIndex];
    return (
      <Box
        sx={{
          position: 'relative',
          maxWidth: '900px',
          mx: 'auto',
          py: 4,
        }}
      >
        {/* Carousel Content */}
        <Box
          sx={{
            position: 'relative',
            minHeight: '400px',
            overflow: 'hidden',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.4 }}
              style={{ width: '100%' }}
            >
              {renderCard(currentSlide, currentIndex)}
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* Navigation Controls */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            mt: 4,
          }}
        >
          {/* Previous Button */}
          <IconButton
            onClick={handlePrev}
            sx={{
              backgroundColor: '#141414',
              border: '2px solid #333333',
              color: '#ffffff',
              width: 48,
              height: 48,
              '&:hover': {
                backgroundColor: '#1a1a1a',
                borderColor: '#d4af37',
              },
            }}
          >
            <CaretLeft size={24} weight="bold" />
          </IconButton>

          {/* Dots Indicator */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {techStackSlides.map((_, idx) => (
              <Box
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                sx={{
                  width: currentIndex === idx ? 32 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: currentIndex === idx ? techStackSlides[idx].color : '#333333',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Box>

          {/* Next Button */}
          <IconButton
            onClick={handleNext}
            sx={{
              backgroundColor: '#141414',
              border: '2px solid #333333',
              color: '#ffffff',
              width: 48,
              height: 48,
              '&:hover': {
                backgroundColor: '#1a1a1a',
                borderColor: '#d4af37',
              },
            }}
          >
            <CaretRight size={24} weight="bold" />
          </IconButton>
        </Box>
      </Box>
    );
  }

  // Desktop: Grid view
  return (
    <Grid container spacing={3}>
      {techStackSlides.map((slide, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          {renderCard(slide, index)}
        </Grid>
      ))}
    </Grid>
  );
}
