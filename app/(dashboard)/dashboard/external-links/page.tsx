'use client';

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
} from '@mui/material';
import { Link as LinkIcon } from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

import ResourceGrid from '@/components/shared/ResourceGrid';

interface ExternalLink {
  id: string;
  title: string;
  description: string | null;
  url: string;
  logo_url: string | null;
  icon_url: string | null;
  color: string;
  color_hex: string;
  display_order: number;
  is_active: boolean;
}

export default function ExternalLinksPage() {
  const supabase = createClient();

  // Fetch active external links
  const { data: links = [], isLoading } = useQuery({
    queryKey: ['external-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('external_links')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Convert storage paths to public URLs
      return (data as ExternalLink[])?.map(link => ({
        ...link,
        logo_url: link.logo_url ? supabase.storage.from('documents').getPublicUrl(link.logo_url).data.publicUrl : link.logo_url,
        icon_url: link.icon_url ? supabase.storage.from('documents').getPublicUrl(link.icon_url).data.publicUrl : link.icon_url,
      })) || [];
    },
  });

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0D0D0D' }}>
      <Box sx={{ flex: 1, overflow: 'auto', p: 4 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <ResourceGrid
              items={links.map((link) => ({
                id: link.id,
                title: link.title,
                description: link.description,
                type: 'link',
                url: link.url,
                logo_url: link.icon_url || link.logo_url || null,
                color: link.color_hex || link.color,
              }))}
              onItemClick={(item) => {
                if (item.url) window.open(item.url, '_blank');
              }}
              cardHeight={180}
            />

            {links.length === 0 && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 8,
                  color: '#666666',
                }}
              >
                <Typography variant="h6" sx={{ mb: 1, color: '#B0B0B0' }}>
                  No external resources available yet
                </Typography>
                <Typography variant="body2" sx={{ color: '#808080' }}>
                  Contact your administrator to add external resource links
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
