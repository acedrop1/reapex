'use client';

import { Button, Box } from '@mui/material';
import { ShareNetwork } from '@phosphor-icons/react';

export default function ListingActions() {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant="outlined"
        startIcon={<ShareNetwork size={20} weight="duotone" />}
        onClick={handleShare}
        sx={{
          borderColor: '#1a1a1a',
          color: '#1a1a1a',
          '&:hover': {
            borderColor: '#333333',
            backgroundColor: '#f5f5f5',
          },
        }}
      >
        Share
      </Button>
    </Box>
  );
}
