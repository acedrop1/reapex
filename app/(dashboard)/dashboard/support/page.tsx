'use client';

import { Box, Typography } from '@mui/material';

const ActionCard = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <Box
    component="a"
    href="#"
    onClick={(e: React.MouseEvent) => e.preventDefault()}
    sx={{
      display: 'flex', alignItems: 'center', gap: 2, p: 2.5,
      background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px',
      textDecoration: 'none', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'pointer',
      '&:hover': { borderColor: 'rgba(226, 192, 90, 0.2)', transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' },
    }}
  >
    <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(226,192,90,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E2C05A', fontSize: '18px', flexShrink: 0 }}>
      💬
    </Box>
    <Box>
      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>{title}</Typography>
      <Typography sx={{ fontSize: '12px', color: '#aaaaaa' }}>{subtitle}</Typography>
    </Box>
  </Box>
);

const QuickLink = ({ label }: { label: string }) => (
  <Box
    component="a"
    href="#"
    onClick={(e: React.MouseEvent) => e.preventDefault()}
    sx={{
      display: 'flex', alignItems: 'center', gap: 1.1,
      p: '12px 14px', borderRadius: '8px', background: '#1a1a1a',
      border: '1px solid rgba(226, 192, 90, 0.08)', fontSize: '12px', fontWeight: 600,
      color: '#FFFFFF', textDecoration: 'none', cursor: 'pointer',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      '&:hover': { borderColor: 'rgba(226, 192, 90, 0.2)', background: '#181818', transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' },
    }}
  >
    <Box sx={{ width: 15, height: 15, borderRadius: '50%', background: 'rgba(226,192,90,0.2)', flexShrink: 0 }} />
    {label}
  </Box>
);

export default function SupportPage() {
  return (
    <Box sx={{ p: { xs: 2, md: '24px 28px' }, fontFamily: "'DM Sans', sans-serif" }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: '#FFFFFF' }}>Support & Brokerage</Typography>
      </Box>

      {/* Support Actions */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <ActionCard title="Submit Support Ticket" subtitle="Get help from the operations team" />
        <ActionCard title="Ask a Broker Question" subtitle="Direct line to your managing broker" />
      </Box>

      {/* Our People */}
      <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ p: '16px 20px', borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Our People</Typography>
        </Box>
        <Box sx={{ p: '16px 20px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
            <QuickLink label="Company Directory" />
            <QuickLink label="Preferred Vendor List" />
          </Box>
        </Box>
      </Box>

      {/* Office Resources */}
      <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ p: '16px 20px', borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Office Resources</Typography>
        </Box>
        <Box sx={{ p: '16px 20px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
            <QuickLink label="Book Conference Room" />
            <QuickLink label="Wi-Fi / Printer Setup" />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
