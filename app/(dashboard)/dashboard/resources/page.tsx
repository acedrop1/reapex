'use client';

import { Box, Typography, Grid, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

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

// Helper to get high-res favicon via Google's service (fallback when no icon uploaded)
const favicon = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
};

// Category display order and labels
const CATEGORY_ORDER = [
  'Forms & Compliance',
  'Marketing & Branding',
  'Training & Knowledge',
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

  // Group links by category
  const grouped = links.reduce<Record<string, ExternalLink[]>>((acc, link) => {
    const cat = link.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(link);
    return acc;
  }, {});

  // Sort categories: known ones first in order, then any extras alphabetically
  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped)
      .filter((c) => !CATEGORY_ORDER.includes(c))
      .sort(),
  ];

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0D0D0D' }}>
      <Box sx={{ flex: 1, overflow: 'auto', p: 4 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : sortedCategories.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#666666' }}>
            <Typography variant="h6" sx={{ mb: 1, color: '#B0B0B0' }}>
              No resources available yet
            </Typography>
            <Typography variant="body2" sx={{ color: '#808080' }}>
              Contact your administrator to add resource links
            </Typography>
          </Box>
        ) : (
          sortedCategories.map((cat) => {
            const catLinks = grouped[cat];
            return (
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
                <Grid container spacing={2}>
                  {catLinks.map((link) => {
                    const logoSrc = link.icon_url || link.logo_url || favicon(link.url);
                    return (
                      <Grid item xs={6} sm={4} md={3} lg={2} key={link.id}>
                        <Box
                          component="a"
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: 1.5,
                            p: 3,
                            borderRadius: 3,
                            backgroundColor: '#121212',
                            border: '1px solid #2A2A2A',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            '&:hover': {
                              borderColor: '#E2C05A',
                              backgroundColor: '#1A1A1A',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 20px rgba(226, 192, 90, 0.1)',
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 64,
                              height: 64,
                              borderRadius: 2,
                              backgroundColor: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={logoSrc || ''}
                              alt={link.title}
                              width={40}
                              height={40}
                              style={{ objectFit: 'contain' }}
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.textContent = link.title.charAt(0);
                                  parent.style.fontSize = '28px';
                                  parent.style.fontWeight = '700';
                                  parent.style.color = '#333';
                                }
                              }}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#E0E0E0',
                              fontWeight: 500,
                              fontSize: '0.8rem',
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {link.title}
                          </Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
