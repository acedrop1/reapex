'use client';

import React from 'react';
import { Box, Typography, Avatar, Rating, Chip } from '@mui/material';

interface AgentProfileHeaderProps {
  agent: {
    id: string;
    full_name: string;
    title?: string | null;
    headshot_url?: string | null;
    license_number?: string | null;
    email_public?: string | null;
    phone?: string | null;
    nmls_number?: string | null;
    years_experience?: number | null;
    bio?: string | null;
    social_facebook?: string | null;
    social_instagram?: string | null;
    social_linkedin?: string | null;
    social_tiktok?: string | null;
    social_x?: string | null;
  };
  averageRating?: number;
  totalReviews?: number;
}

export default function AgentProfileHeader({
  agent,
  averageRating = 0,
  totalReviews = 0,
}: AgentProfileHeaderProps) {
  return (
    <Box
      sx={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: '12px',
        padding: '32px',
        marginBottom: '32px',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: '32px',
        alignItems: { xs: 'center', md: 'flex-start' },
      }}
    >
      {/* Agent Avatar */}
      <Avatar
        src={agent.headshot_url || undefined}
        alt={agent.full_name}
        sx={{
          width: 200,
          height: 200,
          border: '4px solid #2a2a2a',
          boxShadow: '0 4px 8px 0 rgba(212, 175, 55, 0.2)',
        }}
      >
        {agent.full_name?.charAt(0)}
      </Avatar>

      {/* Agent Info */}
      <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
        {/* Role Label - Use title from database */}
        <Typography
          variant="overline"
          sx={{
            color: '#d4af37',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '1px',
            marginBottom: '8px',
            display: 'block',
          }}
        >
          {agent.title || 'LICENSED REALTOR'}
        </Typography>

        {/* Agent Name */}
        <Typography
          variant="h3"
          sx={{
            color: '#ffffff',
            fontSize: '32px',
            fontWeight: 700,
            marginBottom: '8px',
          }}
        >
          {agent.full_name}
        </Typography>

        {/* Years of Experience */}
        {agent.years_experience && (
          <Typography
            variant="body1"
            sx={{
              color: '#999999',
              fontSize: '16px',
              fontWeight: 500,
              marginBottom: '12px',
            }}
          >
            {agent.years_experience} {agent.years_experience === 1 ? 'Year' : 'Years'} of Experience
          </Typography>
        )}

        {/* Professional Details - NMLS# */}
        {agent.nmls_number && (
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              marginBottom: '12px',
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', md: 'flex-start' },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#999999',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              NMLS# {agent.nmls_number}
            </Typography>
          </Box>
        )}

        {/* Rating */}
        {totalReviews > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
              justifyContent: { xs: 'center', md: 'flex-start' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography
                variant="h6"
                sx={{ color: '#ffffff', fontWeight: 600 }}
              >
                {averageRating.toFixed(1)}
              </Typography>
              <Rating
                value={averageRating}
                precision={0.1}
                readOnly
                sx={{
                  '& .MuiRating-iconFilled': {
                    color: '#d4af37',
                  },
                  '& .MuiRating-iconEmpty': {
                    color: '#2a2a2a',
                  },
                }}
              />
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: '#d4af37',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              See all reviews
            </Typography>
          </Box>
        )}

        {/* Specialties */}
        {agent.specialties && agent.specialties.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '24px',
              justifyContent: { xs: 'center', md: 'flex-start' },
            }}
          >
            {agent.specialties.map((specialty: string, index: number) => (
              <Chip
                key={index}
                label={specialty}
                variant="outlined"
                sx={{
                  borderColor: '#2a2a2a',
                  color: '#ffffff',
                  backgroundColor: 'transparent',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  height: '32px',
                  '&:hover': {
                    borderColor: '#d4af37',
                    backgroundColor: '#1a1a1a',
                  },
                }}
              />
            ))}
          </Box>
        )}

        {/* Bio */}
        {agent.bio && (
          <Box
            sx={{
              marginTop: '24px',
              padding: '20px',
              backgroundColor: '#141414',
              borderRadius: '8px',
              borderLeft: '4px solid #d4af37',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: '#cccccc',
                fontSize: '15px',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}
            >
              {agent.bio}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
