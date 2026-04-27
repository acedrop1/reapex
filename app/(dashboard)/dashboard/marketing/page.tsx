'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Box, Typography } from '@mui/material';

const FilterBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <Box
    component="button"
    onClick={onClick}
    sx={{
      px: 1.75, py: 0.75, borderRadius: '100px', fontSize: '12px', fontWeight: 500,
      background: active ? 'rgba(226,192,90,0.12)' : '#111111',
      border: `1px solid ${active ? 'rgba(226, 192, 90, 0.2)' : 'rgba(226, 192, 90, 0.08)'}`,
      color: active ? '#E2C05A' : '#aaaaaa', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      '&:hover': { transform: 'translateY(-1px)', background: 'rgba(226,192,90,0.12)', color: '#E2C05A' },
    }}
  >
    {children}
  </Box>
);

const ActionCard = ({ title, subtitle, onClick }: { title: string; subtitle: string; onClick?: () => void }) => (
  <Box
    component="a"
    href="#"
    onClick={(e: React.MouseEvent) => { e.preventDefault(); onClick?.(); }}
    sx={{
      display: 'flex', alignItems: 'center', gap: 2, p: 2.5,
      background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px',
      textDecoration: 'none', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'pointer',
      '&:hover': { borderColor: 'rgba(226, 192, 90, 0.2)', transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' },
    }}
  >
    <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(226,192,90,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E2C05A', fontSize: '18px', flexShrink: 0 }}>
      ★
    </Box>
    <Box>
      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>{title}</Typography>
      <Typography sx={{ fontSize: '12px', color: '#aaaaaa' }}>{subtitle}</Typography>
    </Box>
  </Box>
);

const BrandCard = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <Box sx={{
    p: 2.5, background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px',
    textAlign: 'center', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    '&:hover': { borderColor: 'rgba(226, 192, 90, 0.2)', transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' },
  }}>
    <Box sx={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(226,192,90,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5, color: '#E2C05A', fontSize: '16px' }}>
      ◆
    </Box>
    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', mb: 0.5 }}>{title}</Typography>
    <Typography sx={{ fontSize: '12px', color: '#aaaaaa' }}>{subtitle}</Typography>
  </Box>
);

export default function MarketingPage() {
  const supabase = createClient();
  const [activeFilter, setActiveFilter] = useState('request');

  // Fetch canva templates
  const { data: templates = [] } = useQuery({
    queryKey: ['canva-templates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('canva_templates')
        .select('*')
        .order('display_order', { ascending: true });
      return data || [];
    },
  });

  return (
    <Box sx={{ p: { xs: 2, md: '24px 28px' }, fontFamily: "'DM Sans', sans-serif" }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: '#FFFFFF' }}>Marketing & Branding</Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 0.75, mb: 2 }}>
        <FilterBtn active={activeFilter === 'request'} onClick={() => setActiveFilter('request')}>Request Center</FilterBtn>
        <FilterBtn active={activeFilter === 'brand'} onClick={() => setActiveFilter('brand')}>Brand Assets</FilterBtn>
        <FilterBtn active={activeFilter === 'personal'} onClick={() => setActiveFilter('personal')}>Personal Branding</FilterBtn>
      </Box>

      {/* Request Center */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <ActionCard title="Request Custom Design" subtitle="Flyers, social posts, digital ads" />
        <ActionCard title="Listing Launch Package" subtitle="Full marketing kit for new listings" />
      </Box>

      {/* Brand Assets */}
      <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', overflow: 'hidden', mb: 2.5, '&:hover': { borderColor: 'rgba(226,192,90,0.1)' } }}>
        <Box sx={{ p: '16px 20px', borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Brand Assets</Typography>
        </Box>
        <Box sx={{ p: '16px 20px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
            <BrandCard title="Logos" subtitle="All versions & formats" />
            <BrandCard title="Email Signature" subtitle="Generator tool" />
            <BrandCard title="Style Guide" subtitle="Colors, fonts, usage" />
          </Box>
        </Box>
      </Box>

      {/* Canva Templates (from DB) */}
      {templates.length > 0 && (
        <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', overflow: 'hidden', mb: 2.5 }}>
          <Box sx={{ p: '16px 20px', borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Canva Templates</Typography>
          </Box>
          <Box sx={{ p: '16px 20px' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
              {templates.map((t: any) => (
                <Box key={t.id} component="a" href={t.canva_url || '#'} target="_blank" rel="noopener noreferrer" sx={{
                  p: 2, background: '#1a1a1a', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '8px',
                  textAlign: 'center', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.3s ease',
                  '&:hover': { borderColor: 'rgba(226, 192, 90, 0.2)', transform: 'translateY(-2px)' },
                }}>
                  {t.preview_image_url && (
                    <Box component="img" src={t.preview_image_url} alt={t.name} sx={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: '6px', mb: 1 }} />
                  )}
                  <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>{t.name}</Typography>
                  <Typography sx={{ fontSize: '11px', color: '#666666', textTransform: 'capitalize' }}>{t.category?.replace('_', ' ')}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* Personal Branding */}
      <Box>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', mb: 0.75 }}>Personal Branding</Typography>
        <Typography sx={{ fontSize: '13px', color: '#aaaaaa', mb: 2 }}>Build your unique brand with downloadable templates and resources.</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
          {[
            { title: 'Downloadable Graphics', desc: 'Holidays, market stats, "Just Listed" templates' },
            { title: 'Building Your Brand', desc: 'Our guide to building your brand (Video)' },
            { title: 'Website Templates', desc: 'Agent website template examples' },
          ].map((item, i) => (
            <Box key={i} sx={{
              p: 2.5, background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px',
              cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': { borderColor: 'rgba(226, 192, 90, 0.2)', transform: 'translateY(-3px)' },
            }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(226,192,90,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, color: '#E2C05A', fontSize: '14px' }}>●</Box>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', mb: 0.5 }}>{item.title}</Typography>
              <Typography sx={{ fontSize: '12px', color: '#aaaaaa' }}>{item.desc}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
