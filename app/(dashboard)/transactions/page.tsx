'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Box, Typography } from '@mui/material';
import Link from 'next/link';

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

export default function TransactionsPage() {
  const supabase = createClient();
  const [filter, setFilter] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      return data;
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', user?.id, filter],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('agent_id', user.id)
        .order('updated_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: 'rgba(226,192,90,0.12)', color: '#E2C05A', label: 'Pending' },
      under_contract: { bg: 'rgba(255,176,32,0.12)', color: '#ffb020', label: 'Under Contract' },
      closed: { bg: 'rgba(0,230,138,0.12)', color: '#00e68a', label: 'Closed' },
      cancelled: { bg: 'rgba(255,77,106,0.12)', color: '#ff4d6a', label: 'Cancelled' },
    };
    const s = map[status] || map.pending;
    return (
      <Box sx={{ display: 'inline-flex', px: 1.1, py: 0.25, borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</Box>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: '24px 28px' }, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: '#FFFFFF' }}>Transaction Center</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box component={Link} href="/transactions/new" sx={{
            display: 'inline-flex', px: 2.25, py: 1, borderRadius: '8px',
            fontSize: '13px', fontWeight: 600, background: '#E2C05A', color: '#000000',
            textDecoration: 'none', '&:hover': { background: '#c4a43e' },
          }}>
            + Start New Transaction
          </Box>
          <Box component="a" href="https://www.zipformplus.com" target="_blank" rel="noopener noreferrer" sx={{
            display: 'inline-flex', px: 2.25, py: 1, borderRadius: '8px',
            fontSize: '13px', fontWeight: 600, background: 'transparent',
            border: '1px solid rgba(226, 192, 90, 0.2)', color: '#E2C05A',
            textDecoration: 'none', '&:hover': { background: 'rgba(226,192,90,0.06)' },
          }}>
            Login to zipForm
          </Box>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5 }}>
        {[{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'under_contract', label: 'Active' }, { key: 'closed', label: 'Closed' }].map(f => (
          <FilterBtn key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</FilterBtn>
        ))}
      </Box>

      {/* Disclaimer */}
      <Box sx={{
        fontStyle: 'italic', fontSize: '12px', color: '#aaaaaa', mb: 2,
        p: '12px 16px', borderLeft: '3px solid #E2C05A',
        background: 'rgba(226,192,90,0.03)', borderRadius: '8px',
      }}>
        Note: This table is updated daily by admin. For real-time file details, please log in to the transaction platform.
      </Box>

      {/* Transactions Table */}
      <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Property', 'City', 'Status', 'Sale Price', 'GCI', 'Closing Date'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666666', borderBottom: '1px solid rgba(226,192,90,0.08)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t: any) => (
                <tr key={t.id} style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: '#FFFFFF', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                    <Link href={`/transactions/${t.id}`} style={{ color: '#FFFFFF', textDecoration: 'none' }}>{t.property_address}</Link>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#666666', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>{t.property_city}</td>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>{getStatusBadge(t.status)}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: '#FFFFFF', fontFamily: "'JetBrains Mono', monospace", borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                    ${t.sale_price?.toLocaleString() || '—'}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: '#E2C05A', fontFamily: "'JetBrains Mono', monospace", borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                    ${t.gci?.toLocaleString() || '—'}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#aaaaaa', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                    {t.closing_date ? new Date(t.closing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#666666', fontSize: '13px' }}>No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </Box>
      </Box>

      {/* Compliance Box */}
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(0,230,138,0.05), rgba(226,192,90,0.03))',
        border: '1px solid rgba(0,230,138,0.12)', borderRadius: '12px',
        p: '20px 24px', mb: 2, transition: 'all 0.3s ease',
        '&:hover': { borderColor: 'rgba(0,230,138,0.25)' },
      }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#00e68a', mb: 0.5 }}>Our &quot;Green Light&quot; Compliance Policy</Typography>
        <Typography sx={{ fontSize: '12px', color: '#aaaaaa', lineHeight: 1.6 }}>
          The &quot;Clear to Close&quot; status is the official trigger for our accounting to issue your commission payment. It is your responsibility to ensure all required documents are submitted and approved in a timely manner.
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 1.5 }}>
        {['Compliance Tracker', 'Closed Archive', 'Submit Documents'].map(label => (
          <Box key={label} component="a" href="#" onClick={(e: React.MouseEvent) => e.preventDefault()} sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            px: 2.25, py: 1, borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            background: 'transparent', border: '1px solid rgba(226, 192, 90, 0.2)',
            color: '#E2C05A', textDecoration: 'none',
            '&:hover': { background: 'rgba(226,192,90,0.06)' },
          }}>
            {label}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
