'use client';

import { Box, Typography, Grid } from '@mui/material';

interface ResourceLink {
  name: string;
  url: string;
  icon: string; // emoji or URL
  category: 'mls' | 'tools' | 'associations';
}

const RESOURCE_LINKS: ResourceLink[] = [
  // MLS & Listings
  { name: 'Greater Bergen Realtors (GBRAR)', url: 'https://www.greaterbergenrealtors.com/', icon: '🏠', category: 'mls' },
  { name: 'NJMLS', url: 'https://www.njmls.com/', icon: '🏡', category: 'mls' },
  { name: 'HCMLS', url: 'https://www.hcmls.com/', icon: '🏘️', category: 'mls' },
  { name: 'GSMLS', url: 'https://www.gsmls.com/', icon: '🗺️', category: 'mls' },
  { name: 'Realtors Property Resource', url: 'https://www.narrpr.com/', icon: '📊', category: 'mls' },
  { name: 'Zillow', url: 'https://www.zillow.com/', icon: '🔵', category: 'mls' },
  { name: 'LoopNet', url: 'https://www.loopnet.com/', icon: '🔺', category: 'mls' },
  { name: 'Paragon MLS', url: 'https://www.paragonrels.com/', icon: '📋', category: 'mls' },

  // Tools & Software
  { name: 'Supra eKEY', url: 'https://www.supraekey.com/', icon: '🔑', category: 'tools' },
  { name: 'ShowingTime', url: 'https://www.showingtime.com/', icon: '🗓️', category: 'tools' },
  { name: 'DocuSign', url: 'https://www.docusign.com/', icon: '✍️', category: 'tools' },
  { name: 'dotloop', url: 'https://www.dotloop.com/', icon: '🔄', category: 'tools' },

  // Associations & Government
  { name: 'National Association of Realtors', url: 'https://www.nar.realtor/', icon: '®️', category: 'associations' },
  { name: 'NJ Property Records', url: 'https://www.njactb.org/', icon: '🏛️', category: 'associations' },
  { name: 'FEMA FloodSmart', url: 'https://www.floodsmart.gov/', icon: '🌊', category: 'associations' },
  { name: 'NJREC License Renewal Portal', url: 'https://newjersey.mylicense.com/', icon: '📜', category: 'associations' },
];

const CATEGORY_LABELS: Record<string, string> = {
  mls: 'MLS & Listings',
  tools: 'Tools & Software',
  associations: 'Associations & Government',
};

export default function ResourcesPage() {
  const categories = ['mls', 'tools', 'associations'] as const;

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0D0D0D' }}>
      <Box sx={{ flex: 1, overflow: 'auto', p: 4 }}>
        {categories.map((cat) => {
          const links = RESOURCE_LINKS.filter((l) => l.category === cat);
          return (
            <Box key={cat} sx={{ mb: 5 }}>
              <Typography
                variant="overline"
                sx={{
                  color: '#E2C05A',
                  fontWeight: 700,
                  letterSpacing: 2,
                  fontSize: '0.75rem',
                  mb: 2,
                  display: 'block',
                }}
              >
                {CATEGORY_LABELS[cat]}
              </Typography>
              <Grid container spacing={2}>
                {links.map((link) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={link.name}>
                    <Box
                      component="a"
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 1.5,
                        p: 3,
                        borderRadius: 3,
                        backgroundColor: '#121212',
                        border: '1px solid #2A2A2A',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: '#E2C05A',
                          backgroundColor: '#1A1A1A',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 20px rgba(226, 192, 90, 0.1)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 2,
                          backgroundColor: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 32,
                        }}
                      >
                        {link.icon}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#E0E0E0',
                          fontWeight: 500,
                          fontSize: '0.8rem',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {link.name}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
