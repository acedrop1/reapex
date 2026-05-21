'use client';

import { Box, Typography, CircularProgress } from '@mui/material';
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
  category: string | null;
  display_order: number;
  is_active: boolean;
}

// Category display order and labels
const CATEGORY_ORDER = [
  'Property Search',
  'Utility',
  'Government',
];

export default function ResourcesPage() {
  const supabase = createClient();

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['resources-external-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('external_links')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Resolve storage paths to public URLs
      const resolveUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('/') || path.startsWith('http')) return path;
        return supabase.storage.from('documents').getPublicUrl(path).data.publicUrl;
      };

      return (data as ExternalLink[])?.map((link) => ({
        ...link,
        logo_url: resolveUrl(link.logo_url) || link.logo_url,
        icon_url: resolveUrl(link.icon_url) || link.icon_url,
      })) || [];
    },
  });

  // Split links: categorized vs uncategorized
  const categorized = links.filter((l) => l.category && CATEGORY_ORDER.includes(l.category));
  const uncategorized = links.filter((l) => !l.category || !CATEGORY_ORDER.includes(l.category));

  // Group categorized links
  const grouped = categorized.reduce<Record<string, ExternalLink[]>>((acc, link) => {
    const cat = link.category!;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(link);
    return acc;
  }, {});

  // Sort categories in defined order
  const sortedCategories = CATEGORY_ORDER.filter((c) => grouped[c]);

  // Helper to get favicon URL as fallback
  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
      return null;
    }
  };

  // Convert links to ResourceGrid items
  const toGridItems = (items: ExternalLink[]) =>
    items.map((link) => ({
      id: link.id,
      title: link.title,
      description: link.description,
      type: 'link' as const,
      url: link.url,
      logo_url: link.icon_url || link.logo_url || getFavicon(link.url),
      color: link.color_hex || link.color,
    }));

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0D0D0D' }}>
      <Box sx={{ flex: 1, overflow: 'auto', p: 4 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : links.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#666666' }}>
            <Typography variant="h6" sx={{ mb: 1, color: '#B0B0B0' }}>
              No resources available yet
            </Typography>
            <Typography variant="body2" sx={{ color: '#808080' }}>
              Contact your administrator to add resource links
            </Typography>
          </Box>
        ) : (
          <>
            {/* Uncategorized links at the top (no heading) */}
            {uncategorized.length > 0 && (
              <Box sx={{ mb: sortedCategories.length > 0 ? 5 : 0 }}>
                <ResourceGrid
                  items={toGridItems(uncategorized)}
                  compact
                  onItemClick={(item) => {
                    if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer');
                  }}
                />
              </Box>
            )}

            {/* Categorized links grouped by category */}
            {sortedCategories.map((cat) => (
              <Box key={cat} sx={{ mb: 5 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: '#E2C05A',
                    fontWeight: 700,
                    letterSpacing: 2,
                    fontSize: '0.75rem',
                    mb: 2,
                    display: 'block',
                  }}
                >
                  {cat}
                </Typography>
                <ResourceGrid
                  items={toGridItems(grouped[cat])}
                  compact
                  onItemClick={(item) => {
                    if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer');
                  }}
                />
              </Box>
            ))}
          </>
        )}
      </Box>
    </Box>
  );
}
