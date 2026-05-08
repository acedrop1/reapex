'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Typography } from '@mui/material';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import { isAdmin as checkIsAdmin } from '@/lib/utils/auth';
import TemplateGallery from '@/components/marketing/TemplateGallery';
import ResourceGrid from '@/components/shared/ResourceGrid';
import { createClient } from '@/lib/supabase/client';

interface CanvaTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business_card' | 'property_flyer' | 'yard_sign' | 'social_media';
  template_id: string;
  preview_image_url: string | null;
  canva_url: string;
  display_order: number;
}

export default function MarketingPage() {
  const supabase = createClient();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      return profile;
    },
  });

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['canva-templates'],
    queryFn: async () => {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      return data.data as CanvaTemplate[];
    },
  });

  // Fetch external links categorized under Marketing & Branding
  const { data: externalLinks = [] } = useQuery({
    queryKey: ['external-links-marketing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('external_links')
        .select('*')
        .eq('is_active', true)
        .eq('category', 'Marketing & Branding')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []).map((link: any) => ({
        id: link.id,
        title: link.title,
        description: link.description,
        type: 'link' as const,
        url: link.url,
        logo_url: link.icon_url || link.logo_url || null,
        color: link.color_hex || link.color,
        created_at: link.created_at,
      }));
    },
  });

  return (
    <Container maxWidth="xl" sx={{ ...dashboardStyles.container, pt: 2, pb: 4 }}>
      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#E2C05A' }} />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load templates. Please try again later.
        </Alert>
      )}

      {/* Template Gallery */}
      {!isLoading && !error && (
        <TemplateGallery
          templates={templates}
          isAdmin={checkIsAdmin(user?.role)}
        />
      )}

      {/* External Links for Marketing & Branding */}
      {externalLinks.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 2, fontSize: '1rem' }}>
            External Resources
          </Typography>
          <ResourceGrid
            items={externalLinks}
            onItemClick={(item) => {
              if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer');
            }}
          />
        </Box>
      )}
    </Container>
  );
}
