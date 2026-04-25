'use client';

import {
  Container,
  Box,
  Grid,
  Typography,
} from '@mui/material';
import {
  ArrowSquareOut,
  FileText,
  HouseSimple,
  IdentificationCard,
  SignIn,
  Scroll,
  CheckSquare,
  Users
} from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export default function QuickFormsPage() {
  // Fetch forms from Supabase
  const supabase = createClient();
  const { data: formTemplates } = useQuery({
    queryKey: ['admin-forms'], // Sharing query key with admin panel for consistency
    queryFn: async () => {
      // In ManageResources we treat tab 0 as 'brokerage_documents'.
      // We need to filter them? The mock data had 'category'.
      // Admin page fetches ALL from brokerage_documents.
      // Let's assume all brokerage_documents are forms for now or filter by a category if one exists.
      // The migration script inserted them with category='Forms'.
      const { data } = await supabase
        .from('brokerage_documents')
        .select('*')
        .order('order', { ascending: true })
        .order('created_at', { ascending: false });
      return data;
    },
  });

  const handleFormClick = (url: string | null) => {
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
          Quick Forms
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#B0B0B0',
          }}
        >
          Access commonly used real estate forms and documents
        </Typography>
      </Box>

      {/* iOS-Style Icon Grid */}
      <Grid container spacing={4}>
        {formTemplates?.map((form: any) => {
          let IconComponent = FileText;
          const nameLower = form.title?.toLowerCase() || ''; // DB uses 'title' for forms, 'name' for templates? standardizing
          // Migration script inserted with 'title'.
          // Migration script inserted 'category'.

          if (nameLower.includes('listing')) IconComponent = HouseSimple;
          else if (nameLower.includes('purchase')) IconComponent = SignIn;
          else if (nameLower.includes('disclosure')) IconComponent = FileText;
          else if (nameLower.includes('condition')) IconComponent = CheckSquare;
          else if (nameLower.includes('buyer')) IconComponent = Users;
          else if (nameLower.includes('addendum')) IconComponent = Scroll;

          // Use hardcoded colors map based on name or random/hash?
          // Let's reuse the color map logic conceptually or just defaults.
          const colorMap: Record<string, string> = {
            'listing': '#E2C05A',
            'purchase': '#16a34a',
            'disclosure': '#ffb020',
            'condition': '#c49d2f',
            'buyer': '#f0d98a',
            'addendum': '#EF4444'
          };
          let color = '#E2C05A';
          for (const key in colorMap) {
            if (nameLower.includes(key)) color = colorMap[key];
          }

          // Helper to get full URL
          const getDownloadUrl = (fileUrl: string | null, fallbackUrl: string | null) => {
            if (fileUrl) {
              if (fileUrl.startsWith('http')) return fileUrl;
              return supabase.storage.from('documents').getPublicUrl(fileUrl).data.publicUrl;
            }
            return fallbackUrl;
          };

          const downloadUrl = getDownloadUrl(form.file_url, form.url);
          const isComingSoon = !downloadUrl;

          return (
            <Grid item xs={6} sm={4} md={3} lg={2} key={form.id}>
              <Box
                onClick={() => handleFormClick(downloadUrl)}
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
                    '& .form-name': {
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
                  <IconComponent size={50} color={color} weight="duotone" />
                </Box>

                {/* Form Name */}
                <Typography
                  className="form-name"
                  variant="body2"
                  sx={{
                    color: '#FFFFFF',
                    fontWeight: 500,
                    textAlign: 'center',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {form.title || form.name}
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
          How to Use Forms
        </Typography>
        <Box component="ol" sx={{ color: '#B0B0B0', pl: 2.5, m: 0 }}>
          <li>Click on any form icon to download or open</li>
          <li>Fill out the form with required information</li>
          <li>Save or submit according to your state requirements</li>
        </Box>
        <Typography variant="body2" sx={{ color: '#808080', mt: 2 }}>
          💡 Tip: Contact your broker if you need state-specific forms not listed here
        </Typography>
      </Box>
    </Container>
  );
}
