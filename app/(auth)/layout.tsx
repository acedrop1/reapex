import { ReactNode } from 'react';
import { DualAudienceNavBar } from '@/components/layout/DualAudienceNavBar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PublicThemeProvider } from '@/components/providers/PublicThemeProvider';
import { Box } from '@mui/material';

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PublicThemeProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
        <DualAudienceNavBar />
        <Box component="main" sx={{ flexGrow: 1 }}>
          {children}
        </Box>
        <PublicFooter />
      </Box>
    </PublicThemeProvider>
  );
}

