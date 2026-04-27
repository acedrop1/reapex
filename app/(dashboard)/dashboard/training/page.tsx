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

export default function TrainingPage() {
  const supabase = createClient();
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch training resources
  const { data: resources = [] } = useQuery({
    queryKey: ['training-resources'],
    queryFn: async () => {
      const { data } = await supabase
        .from('training_resources')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Fetch external links (training category)
  const { data: externalLinks = [] } = useQuery({
    queryKey: ['external-links-training'],
    queryFn: async () => {
      const { data } = await supabase
        .from('external_links')
        .select('*')
        .eq('category', 'training')
        .order('display_order', { ascending: true });
      return data || [];
    },
  });

  const filteredResources = resources.filter((r: any) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'onboarding') return r.resource_type === 'document' || r.title?.toLowerCase().includes('onboard');
    if (activeFilter === 'tech') return r.resource_type === 'video' || r.title?.toLowerCase().includes('tech') || r.title?.toLowerCase().includes('crm');
    if (activeFilter === 'calendar') return r.resource_type === 'faq' || r.title?.toLowerCase().includes('calendar');
    return true;
  });

  // Default training cards if no DB data
  const defaultTraining = [
    { type: 'Onboarding', title: 'Day 1: Your Tech Setup', desc: 'Get configured with all Reapex systems and tools.', dur: '45 min' },
    { type: 'Onboarding', title: 'Day 2: Our Lead Flow', desc: 'Understand lead routing and maximize conversion.', dur: '30 min' },
    { type: 'Tech Library', title: 'How to Master Our CRM', desc: 'Follow Up Boss — pipelines, automations, reporting.', dur: '60 min · Video' },
    { type: 'Tech Library', title: 'zipForm Deep Dive', desc: 'Form creation, e-signatures, compliance best practices.', dur: '40 min · Video' },
    { type: 'Tech Library', title: 'Using the Marketing Center', desc: 'Request designs, access templates, build your brand.', dur: '25 min · Video' },
    { type: 'Live Event', title: 'Company Calendar', desc: 'View upcoming trainings, meetings, and brokerage events.', dur: 'Google Calendar' },
  ];

  const trainingItems = filteredResources.length > 0
    ? filteredResources.map((r: any) => ({
        type: r.resource_type === 'video' ? 'Tech Library' : r.resource_type === 'document' ? 'Onboarding' : 'Resource',
        title: r.title,
        desc: r.description || '',
        dur: r.resource_type === 'video' ? 'Video' : r.resource_type || '',
        url: r.url || r.file_url,
      }))
    : defaultTraining;

  return (
    <Box sx={{ p: { xs: 2, md: '24px 28px' }, fontFamily: "'DM Sans', sans-serif" }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: '#FFFFFF' }}>Training & Knowledge</Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 0.75, mb: 2 }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'onboarding', label: 'Onboarding' },
          { key: 'tech', label: 'Tech Library' },
          { key: 'calendar', label: 'Calendar' },
        ].map(f => (
          <FilterBtn key={f.key} active={activeFilter === f.key} onClick={() => setActiveFilter(f.key)}>{f.label}</FilterBtn>
        ))}
      </Box>

      {/* Training Cards Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 1.5, mb: 2.5 }}>
        {trainingItems.map((item: any, i: number) => (
          <Box
            key={i}
            component={item.url ? 'a' : 'div'}
            {...(item.url ? { href: item.url, target: '_blank', rel: 'noopener noreferrer' } : {})}
            sx={{
              p: 2.5, background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px',
              cursor: 'pointer', textDecoration: 'none',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': { borderColor: 'rgba(226, 192, 90, 0.2)', transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' },
            }}
          >
            <Box sx={{
              display: 'inline-flex', px: 1, py: 0.25, borderRadius: '4px', fontSize: '10px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.5,
              color: item.type === 'Live Event' ? '#ffb020' : '#E2C05A',
              background: item.type === 'Live Event' ? 'rgba(255,176,32,0.12)' : 'rgba(226,192,90,0.12)',
            }}>
              {item.type}
            </Box>
            <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', mb: 0.5 }}>{item.title}</Typography>
            <Typography sx={{ fontSize: '12px', color: '#aaaaaa', mb: 1.5, lineHeight: 1.5 }}>{item.desc}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '11px', color: '#666666' }}>
              ⏱ {item.dur}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Company Calendar Panel */}
      <Box sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        p: '48px 40px', textAlign: 'center',
        background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px',
      }}>
        <Box sx={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(226,192,90,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, color: '#E2C05A', fontSize: '24px' }}>
          📅
        </Box>
        <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', mb: 0.5 }}>View Company Calendar</Typography>
        <Typography sx={{ fontSize: '13px', color: '#aaaaaa', mb: 0.75 }}>Access shared trainings, meetings, and brokerage events</Typography>
        <Typography sx={{ fontSize: '12px', color: '#666666' }}>Embedded Google Calendar — view your schedule and register for events</Typography>
      </Box>
    </Box>
  );
}
