'use client';

import { Box } from '@mui/material';
import ManageResources from '@/components/admin/ManageResources';

export default function ManageResourcesPage() {
  return (
    <Box sx={{ minHeight: '100%', backgroundColor: '#0D0D0D' }}>
      <ManageResources />
    </Box>
  );
}
