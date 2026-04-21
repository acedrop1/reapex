'use client';

import React from 'react';
import { Box, Typography, IconButton, Tooltip, Button } from '@mui/material';
import { Phone, Language } from '@mui/icons-material';
import {
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  TiktokLogo,
  XLogo,
} from '@phosphor-icons/react';
import {
  ensureHttpsProtocol,
  buildInstagramUrl,
  buildFacebookUrl,
  buildLinkedInUrl,
  buildTikTokUrl,
  buildTwitterUrl
} from '@/lib/utils/url-helpers';

interface AgentAboutSectionProps {
  agentName: string;
  phone?: string | null;
  website?: string | null;
  social_facebook?: string | null;
  social_instagram?: string | null;
  social_linkedin?: string | null;
  social_tiktok?: string | null;
  social_x?: string | null;
}

// Phone number formatting utility
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export default function AgentAboutSection({
  agentName,
  phone,
  website,
  social_facebook,
  social_instagram,
  social_linkedin,
  social_tiktok,
  social_x,
}: AgentAboutSectionProps) {
  const hasAnySocial = social_facebook || social_instagram || social_linkedin || social_tiktok || social_x;

  return (
    <Box
      sx={{
        backgroundColor: '#0a0a0a',
        border: '1px solid #2a2a2a',
        borderRadius: '12px',
        padding: '24px',
      }}
    >
      <Typography
        variant="h5"
        sx={{
          color: '#d4af37',
          fontSize: '20px',
          fontWeight: 600,
          marginBottom: '24px',
        }}
      >
        About {agentName}
      </Typography>

      {/* Website */}
      {website && ensureHttpsProtocol(website) && (
        <Box sx={{ marginBottom: '16px' }}>
          <Button
            component="a"
            href={ensureHttpsProtocol(website) || undefined}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<Language />}
            fullWidth
            sx={{
              backgroundColor: 'transparent',
              border: '1px solid #2a2a2a',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '12px 16px',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              justifyContent: 'flex-start',
              '&:hover': {
                borderColor: '#d4af37',
                backgroundColor: '#1a1a1a',
              },
            }}
          >
            Visit Website
          </Button>
        </Box>
      )}

      {/* Phone Number */}
      {phone && (
        <Box sx={{ marginBottom: hasAnySocial ? '16px' : '0' }}>
          <Button
            component="a"
            href={`tel:${phone}`}
            startIcon={<Phone />}
            fullWidth
            sx={{
              backgroundColor: '#d4af37',
              color: '#0a0a0a',
              borderRadius: '8px',
              padding: '12px 16px',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 600,
              justifyContent: 'flex-start',
              '&:hover': {
                backgroundColor: '#c49d2f',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
              },
            }}
          >
            {formatPhoneNumber(phone)}
          </Button>
        </Box>
      )}

      {/* Social Media Icons */}
      {hasAnySocial && (
        <Box
          sx={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
          }}
        >
          {social_facebook && buildFacebookUrl(social_facebook) && (
            <Tooltip title="Facebook">
              <IconButton
                component="a"
                href={buildFacebookUrl(social_facebook) || undefined}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: '#d4af37',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  padding: '10px',
                  boxShadow: '0 0 8px rgba(212, 175, 55, 0.3)',
                  '&:hover': {
                    backgroundColor: '#1a1a1a',
                    borderColor: '#d4af37',
                    boxShadow: '0 0 12px rgba(212, 175, 55, 0.5)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <FacebookLogo size={24} weight="fill" />
              </IconButton>
            </Tooltip>
          )}

          {social_instagram && buildInstagramUrl(social_instagram) && (
            <Tooltip title="Instagram">
              <IconButton
                component="a"
                href={buildInstagramUrl(social_instagram) || undefined}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: '#d4af37',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  padding: '10px',
                  boxShadow: '0 0 8px rgba(212, 175, 55, 0.3)',
                  '&:hover': {
                    backgroundColor: '#1a1a1a',
                    borderColor: '#d4af37',
                    boxShadow: '0 0 12px rgba(212, 175, 55, 0.5)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <InstagramLogo size={24} weight="fill" />
              </IconButton>
            </Tooltip>
          )}

          {social_linkedin && buildLinkedInUrl(social_linkedin) && (
            <Tooltip title="LinkedIn">
              <IconButton
                component="a"
                href={buildLinkedInUrl(social_linkedin) || undefined}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: '#d4af37',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  padding: '10px',
                  boxShadow: '0 0 8px rgba(212, 175, 55, 0.3)',
                  '&:hover': {
                    backgroundColor: '#1a1a1a',
                    borderColor: '#d4af37',
                    boxShadow: '0 0 12px rgba(212, 175, 55, 0.5)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <LinkedinLogo size={24} weight="fill" />
              </IconButton>
            </Tooltip>
          )}

          {social_tiktok && buildTikTokUrl(social_tiktok) && (
            <Tooltip title="TikTok">
              <IconButton
                component="a"
                href={buildTikTokUrl(social_tiktok) || undefined}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: '#d4af37',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  padding: '10px',
                  boxShadow: '0 0 8px rgba(212, 175, 55, 0.3)',
                  '&:hover': {
                    backgroundColor: '#1a1a1a',
                    borderColor: '#d4af37',
                    boxShadow: '0 0 12px rgba(212, 175, 55, 0.5)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <TiktokLogo size={24} weight="fill" />
              </IconButton>
            </Tooltip>
          )}

          {social_x && buildTwitterUrl(social_x) && (
            <Tooltip title="X (Twitter)">
              <IconButton
                component="a"
                href={buildTwitterUrl(social_x) || undefined}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: '#d4af37',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  padding: '10px',
                  boxShadow: '0 0 8px rgba(212, 175, 55, 0.3)',
                  '&:hover': {
                    backgroundColor: '#1a1a1a',
                    borderColor: '#d4af37',
                    boxShadow: '0 0 12px rgba(212, 175, 55, 0.5)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <XLogo size={24} weight="fill" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {!website && !phone && !hasAnySocial && (
        <Typography
          variant="body2"
          sx={{
            color: '#666666',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '16px',
          }}
        >
          No contact information available
        </Typography>
      )}
    </Box>
  );
}
