'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, CircularProgress, Box } from '@mui/material';

export default function TransactionsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /dashboard/business
    router.replace('/dashboard/business');
  }, [router]);

  return (
    <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress sx={{ color: '#E2C05A' }} />
      </Box>
    </Container>
  );
}
