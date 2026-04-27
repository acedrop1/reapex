'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Box, Typography } from '@mui/material';

const Panel = ({ title, children, borderHighlight }: { title: string; children: React.ReactNode; borderHighlight?: boolean }) => (
  <Box sx={{ background: '#111111', border: `1px solid ${borderHighlight ? 'rgba(226, 192, 90, 0.2)' : 'rgba(226, 192, 90, 0.08)'}`, borderRadius: '12px', overflow: 'hidden', '&:hover': { borderColor: 'rgba(226,192,90,0.1)' } }}>
    <Box sx={{ p: '16px 20px', borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
      <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>{title}</Typography>
    </Box>
    <Box sx={{ p: '16px 20px' }}>{children}</Box>
  </Box>
);

const libraryData = [
  { category: 'Listing Packet', items: 'Listing Presentation (Canva), Seller Intake Form, Listing Launch Checklist, Marketing Menu' },
  { category: 'Buyer Packet', items: 'Buyer Presentation (Canva), Buyer Consult Intake, Affiliated Business Disclosure' },
  { category: 'Brokerage Operations', items: 'Commission Disbursement Form (CDF), Open House Sign-In Sheet, Agent Onboarding Checklist, Referral Agreement' },
  { category: 'Compliance & Guides', items: 'Policy & Procedures Manual, Ad & Social Media Compliance Guide, File Submission Checklist' },
];

export default function FormsPage() {
  const supabase = createClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['brokerage-documents'],
    queryFn: async () => {
      const { data } = await supabase
        .from('brokerage_documents')
        .select('*')
        .order('category', { ascending: true });
      return data || [];
    },
  });

  const docsByCategory: Record<string, any[]> = {};
  documents.forEach((doc: any) => {
    const cat = doc.category || 'Other';
    if (!docsByCategory[cat]) docsByCategory[cat] = [];
    docsByCategory[cat].push(doc);
  });

  return (
    <Box sx={{ p: { xs: 2, md: '24px 28px' }, fontFamily: "'DM Sans', sans-serif" }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: '#FFFFFF' }}>Forms & Compliance</Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        {/* zipForm SSO */}
        <Panel title="Official Transaction Forms" borderHighlight>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography sx={{ fontSize: '13px', color: '#aaaaaa', mb: 2 }}>Your Single Source of Truth</Typography>
            <Box component="a" href="#" onClick={(e: React.MouseEvent) => e.preventDefault()} sx={{
              display: 'inline-flex', px: 3.5, py: 1.5, borderRadius: '8px',
              fontSize: '13px', fontWeight: 600, background: '#E2C05A', color: '#000000',
              textDecoration: 'none', '&:hover': { background: '#c4a43e' },
            }}>
              Access zipForm (SSO Login)
            </Box>
            <Box sx={{
              mt: 2.5, p: 2, borderRadius: '8px',
              background: 'rgba(255,176,32,0.06)', border: '1px solid rgba(255,176,32,0.12)',
            }}>
              <Typography sx={{ fontSize: '11px', color: '#ffb020', lineHeight: 1.6 }}>
                To ensure 100% compliance and legal protection, Reapex agents must only use forms from this system. State and local boards update forms frequently. Using a saved, old version creates massive liability for you and the brokerage.
              </Typography>
            </Box>
          </Box>
        </Panel>

        {/* Internal Library */}
        <Panel title="Reapex Internal Library">
          {Object.keys(docsByCategory).length > 0 ? (
            Object.entries(docsByCategory).map(([category, docs]) => (
              <Box key={category} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#E2C05A', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {category}
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#aaaaaa', lineHeight: 1.6 }}>
                  {docs.map((d: any) => d.title).join(', ')}
                </Typography>
              </Box>
            ))
          ) : (
            libraryData.map((section) => (
              <Box key={section.category} sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.025)', '&:last-child': { borderBottom: 'none' } }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#E2C05A', mb: 0.5 }}>{section.category}</Typography>
                <Typography sx={{ fontSize: '12px', color: '#aaaaaa', lineHeight: 1.6 }}>{section.items}</Typography>
              </Box>
            ))
          )}
        </Panel>
      </Box>
    </Box>
  );
}
