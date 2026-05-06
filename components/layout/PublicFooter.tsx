'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Box, Container, Typography, Link, Grid } from '@mui/material';
import { ReapexLogo } from '@/components/ui/ReapexLogo';
import AgentApplicationModal from '@/components/modals/AgentApplicationModal';

export function PublicFooter() {
  const pathname = usePathname();
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);

  // Homepage has its own footer built into MarketingHomepage
  if (pathname === '/') return null;

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        py: 6,
        mt: 0,
        borderTop: '1px solid rgba(212, 175, 55, 0.15)',
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <ReapexLogo width={150} height={50} />
            <Typography variant="body2" sx={{ mt: 2, color: '#999999' }}>
              Reach Your Real Estate Apex.
              <br />
              A True Partnership Platform.
            </Typography>
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              {/* Fair Housing & Realtor Logos */}
              <img
                src="/Fair-Housing-Logo-PNG-Images-HD.png"
                alt="Equal Housing Opportunity & Realtor"
                style={{ height: '110px', filter: 'brightness(0) invert(1)' }}
              />
              <Typography variant="caption" sx={{ color: '#666666', fontSize: '0.7rem' }}>
                Licensed Real Estate Broker
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/listings" sx={{ color: '#999999', textDecoration: 'none', '&:hover': { color: '#d4af37' } }}>
                Buy or Rent
              </Link>
              <Link href="/sell" sx={{ color: '#999999', textDecoration: 'none', '&:hover': { color: '#d4af37' } }}>
                Sell
              </Link>
              <Link href="/agents" sx={{ color: '#999999', textDecoration: 'none', '&:hover': { color: '#d4af37' } }}>
                Our Agents
              </Link>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" gutterBottom>
              Company
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography
                onClick={() => setApplicationModalOpen(true)}
                sx={{
                  color: '#999999',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': { color: '#d4af37' },
                }}
              >
                Join Us
              </Typography>
              <Link href="/contact" sx={{ color: '#999999', textDecoration: 'none', '&:hover': { color: '#d4af37' } }}>
                Contact Us
              </Link>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" gutterBottom>
              Contact
            </Typography>
            <Typography variant="body2" sx={{ color: '#999999' }}>
              260 Columbia Ave, Suite 20<br />
              Fort Lee, NJ 07024
            </Typography>
            <Typography variant="body2" sx={{ color: '#999999', mt: 1.5 }}>
              info@re-apex.com
            </Typography>
          </Grid>
        </Grid>
        <Box sx={{ borderTop: '1px solid #2a2a2a', mt: 4, pt: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#999999' }}>
            © Reapex - All rights reserved
          </Typography>
        </Box>
      </Container>
      <AgentApplicationModal
        open={applicationModalOpen}
        onClose={() => setApplicationModalOpen(false)}
      />
    </Box>
  );
}

