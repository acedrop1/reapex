'use client';

import { Box, Container } from '@mui/material';
import ListingsTab from '@/components/dashboard/business/ListingsTab';

export default function MyListingsPage() {
  return (
    <Box sx={{ minHeight: '100%', backgroundColor: '#0D0D0D', py: 3 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        <ListingsTab />
      </Container>
    </Box>
  );
}
