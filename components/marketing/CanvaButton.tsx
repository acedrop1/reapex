'use client';

import { Button } from '@mui/material';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';

export function CanvaButton() {
  const handleClick = () => {
    window.open(process.env.NEXT_PUBLIC_CANVA_TEAM_FOLDER_URL || '#', '_blank');
  };

  return (
    <Button
      variant="outlined"
      startIcon={<ArrowSquareOut size={20} weight="duotone" />}
      onClick={handleClick}
      sx={dashboardStyles.button}
    >
      Open Canva Templates
    </Button>
  );
}

