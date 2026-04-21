'use client';

import {
  Container,
  Box,
  Grid,
  Typography,
} from '@mui/material';
import { ArrowSquareOut, ShareNetwork, IdentificationCard, Signpost } from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export default function MarketingPage() {
  const supabase = createClient();


  // Fetch marketing assets from Supabase
  const { data: marketingTemplates } = useQuery({
    queryKey: ['admin-marketing'], // Sharing query key with admin panel for consistency
    queryFn: async () => {
      const { data } = await supabase
        .from('canva_templates')
        .select('*')
        .order('order', { ascending: true })
        .order('created_at', { ascending: false });
      return data;
    },
  });

  const handleTemplateClick = (url: string | null) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Container maxWidth="xl" sx={dashboardStyles.container}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            color: '#FFFFFF',
            fontWeight: 600,
            mb: 1,
          }}
        >
          Marketing & Branding
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#B0B0B0',
          }}
        >
          Professional templates to showcase your brand
        </Typography>
      </Box>

      {/* iOS-Style Icon Grid */}
      <Grid container spacing={4}>
        {marketingTemplates?.map((template: any) => {
          const IconComponent = template.icon ? (template.icon === 'IdentificationCard' ? IdentificationCard : template.icon === 'Signpost' ? Signpost : ShareNetwork) : ShareNetwork; // Basic fallback logic or mapping needed if icons are dynamic strings
          // Better logic: Resource doesn't store icon component, maybe hardcoded mapping based on name?
          // Or we utilize the 'icon' field if we migrated it as string.
          // For now, let's use a generic icon or map based on name keywords.
          let DisplayIcon = ShareNetwork;
          if (template.name.toLowerCase().includes('card')) DisplayIcon = IdentificationCard;
          if (template.name.toLowerCase().includes('sign')) DisplayIcon = Signpost;

          const color = template.color || '#E2C05A'; // Fallback color
          const isComingSoon = !template.canva_url; // Determine based on URL presence

          return (
            <Grid item xs={6} sm={4} md={3} lg={2} key={template.id}>
              <Box
                onClick={() => handleTemplateClick(template.canva_url)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  cursor: isComingSoon ? 'default' : 'pointer',
                  opacity: isComingSoon ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  '&:hover': isComingSoon ? {} : {
                    '& .icon-container': {
                      transform: 'scale(1.1)',
                      backgroundColor: `${color}20`,
                    },
                    '& .template-name': {
                      color: color,
                    },
                  },
                }}
              >
                {/* iOS-Style Icon */}
                <Box
                  className="icon-container"
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: '22px', // iOS-style rounded corners
                    backgroundColor: `${color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  <DisplayIcon size={50} color={color} weight="duotone" />
                </Box>

                {/* Template Name */}
                <Typography
                  className="template-name"
                  variant="body2"
                  sx={{
                    color: '#FFFFFF',
                    fontWeight: 500,
                    textAlign: 'center',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {template.name}
                  {isComingSoon && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        display: 'block',
                        color: '#808080',
                        fontSize: '0.7rem',
                        mt: 0.5,
                      }}
                    >
                      Coming Soon
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Instructions */}
      <Box
        sx={{
          mt: 6,
          p: 3,
          backgroundColor: 'rgba(226, 192, 90, 0.08)',
          border: '1px solid rgba(226, 192, 90, 0.3)',
          borderRadius: '12px',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 2 }}>
          How to Use Templates
        </Typography>
        <Box component="ol" sx={{ color: '#B0B0B0', pl: 2.5, m: 0 }}>
          <li>Click on any template icon to open it in Canva</li>
          <li>Customize the template with your information</li>
          <li>Download your design when finished</li>
        </Box>
        <Typography variant="body2" sx={{ color: '#808080', mt: 2 }}>
          💡 Tip: Save your customized designs in Canva to access them later
        </Typography>
      </Box>
    </Container>
  );
}
