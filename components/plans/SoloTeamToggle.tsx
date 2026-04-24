'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { User, Users } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

export default function SoloTeamToggle() {
  const [isSolo, setIsSolo] = useState(true);

  return (
    <Box
      sx={{
        display: 'inline-flex',
        backgroundColor: '#141414',
        border: '1px solid #333333',
        borderRadius: 3,
        p: 0.5,
        gap: 0.5,
      }}
    >
      {/* Solo Agent Option */}
      <Box
        onClick={() => setIsSolo(true)}
        sx={{
          position: 'relative',
          px: 4,
          py: 2,
          borderRadius: 2.5,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backgroundColor: isSolo ? '#d4af37' : 'transparent',
          '&:hover': {
            backgroundColor: isSolo ? '#d4af37' : 'rgba(212, 175, 55, 0.1)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <User
            size={24}
            weight="duotone"
            color={isSolo ? '#0a0a0a' : '#999999'}
          />
          <Typography
            sx={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 700,
              fontSize: '1rem',
              color: isSolo ? '#0a0a0a' : '#999999',
              transition: 'color 0.3s ease',
            }}
          >
            I am a Solo Agent
          </Typography>
        </Box>
      </Box>

      {/* Team Leader Option */}
      <Box
        onClick={() => setIsSolo(false)}
        sx={{
          position: 'relative',
          px: 4,
          py: 2,
          borderRadius: 2.5,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backgroundColor: !isSolo ? '#d4af37' : 'transparent',
          '&:hover': {
            backgroundColor: !isSolo ? '#d4af37' : 'rgba(212, 175, 55, 0.1)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Users
            size={24}
            weight="duotone"
            color={!isSolo ? '#0a0a0a' : '#999999'}
          />
          <Typography
            sx={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 700,
              fontSize: '1rem',
              color: !isSolo ? '#0a0a0a' : '#999999',
              transition: 'color 0.3s ease',
            }}
          >
            I Lead a Team
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
